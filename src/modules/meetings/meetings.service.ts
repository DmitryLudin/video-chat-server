import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostgresErrorCode } from 'src/modules/database/constants';
import {
  AddMessageDto,
  CreateMeetingDto,
  CreateMemberDto,
} from 'src/modules/meetings/dto';
import { Meeting } from 'src/modules/meetings/entities';
import { MemberService } from 'src/modules/meetings/services/member.service';
import { MessagesService } from 'src/modules/meetings/services/messages.service';
import { Repository } from 'typeorm';

@Injectable()
export class MeetingsService {
  constructor(
    @InjectRepository(Meeting)
    private readonly meetingsRepository: Repository<Meeting>,
    private readonly membersService: MemberService,
    private readonly messagesService: MessagesService,
  ) {}

  // Meeting methods
  async getById(id: string) {
    const meeting = await this.meetingsRepository.findOne({
      where: { id },
    });

    if (!meeting) {
      throw new NotFoundException({
        message: `Встреча с таким id ${id} не найдена`,
        code: 'meeting_not_found',
      });
    }

    return meeting;
  }

  async getByIdAndUserId(meetingId: string, userId: number) {
    const meeting = await this.getById(meetingId);
    const member = meeting.members.find((member) => member.userId === userId);

    if (!member) {
      throw new NotFoundException({
        message: `Пользователь не является участником встречи`,
        code: 'user_not_member',
      });
    }

    return meeting;
  }

  async getByMemberId(memberId: string) {
    const meeting = await this.meetingsRepository.findOne({
      where: {
        members: { id: memberId },
      },
    });

    if (!meeting) {
      throw new NotFoundException({
        message: `Пользователь не является участником встречи`,
        code: 'user_not_member',
      });
    }

    return meeting;
  }

  async getByUserId(userId: number) {
    const meeting = await this.meetingsRepository.findOne({
      where: {
        members: { userId },
      },
    });

    if (!meeting) {
      throw new NotFoundException({
        message: `Пользователь не является участником встречи`,
        code: 'user_not_member',
      });
    }

    return meeting;
  }

  async create(meetingData: CreateMeetingDto) {
    const { ownerId } = meetingData;

    const meeting = this.meetingsRepository.create({
      ownerId,
      members: [{ userId: ownerId }],
    });
    await this.meetingsRepository.save(meeting);

    return this.getById(meeting.id);
  }

  async endMeeting(id: string) {
    await this.messagesService.deleteAllByMeetingId(id);
    return await this.meetingsRepository.delete({ id });
  }

  // Messages methods
  async getAllMessages(meetingId: string) {
    return await this.messagesService.getAllByMeetingId(meetingId);
  }

  async addMessage(addMessageData: AddMessageDto) {
    await this.messagesService.addMessage(addMessageData);

    return await this.messagesService.getAllByMeetingId(
      addMessageData.meetingId,
    );
  }

  // Member methods
  async addMember(meetingId: string, memberData: CreateMemberDto) {
    try {
      const meeting = await this.getById(meetingId);
      const savedMeeting = await this.meetingsRepository.save({
        ...meeting,
        members: [...meeting.members, memberData],
      });

      return this.getById(savedMeeting.id);
    } catch (error: unknown) {
      const postgresError = error as { code?: string };

      if (postgresError?.code === PostgresErrorCode.UniqueViolation) {
        throw new HttpException(
          'Пользователь уже является участником встречи',
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        'Что-то пошло не так',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteMember(meetingId: string, userId: number) {
    try {
      await this.membersService.deleteByUserId(userId);
      return await this.getById(meetingId);
    } catch {
      throw new HttpException(
        'Что-то пошло не так',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}