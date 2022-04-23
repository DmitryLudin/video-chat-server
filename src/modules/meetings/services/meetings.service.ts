import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostgresErrorCode } from 'src/modules/database/constants';
import { CreateMeetingDto, CreateMemberDto } from 'src/modules/meetings/dto';
import { Meeting } from 'src/modules/meetings/entities';
import { MemberService } from 'src/modules/meetings/services/member.service';
import { Repository } from 'typeorm';

@Injectable()
export class MeetingsService {
  constructor(
    @InjectRepository(Meeting)
    private readonly meetingsRepository: Repository<Meeting>,
    private readonly membersService: MemberService,
  ) {}

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
    const savedMeeting = await this.meetingsRepository.save(meeting);

    return this.getById(savedMeeting.id);
  }

  async addMember(meetingId: string, memberData: CreateMemberDto) {
    try {
      const meeting = await this.getById(meetingId);
      const member = await this.membersService.create(memberData);

      return await this.meetingsRepository.save({
        ...meeting,
        members: [...meeting.members, member],
      });
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

  async endMeeting(id: string) {
    return await this.meetingsRepository.delete({ id });
  }
}
