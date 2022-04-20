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
import { In, Repository } from 'typeorm';

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
      throw new NotFoundException(`Встреча с таким id ${id} не найдена`);
    }

    return meeting;
  }

  async getByUserId(meetingId: string, userId: number) {
    const meeting = await this.meetingsRepository.findOne({
      where: {
        id: meetingId,
        members: { userId },
      },
    });

    if (!meeting) {
      throw new NotFoundException(`Встреча с таким id ${meetingId} не найдена`);
    }

    return meeting;
  }

  async create(meetingData: CreateMeetingDto) {
    const { ownerId } = meetingData;

    const member = await this.membersService.create({ userId: ownerId });
    const meeting = this.meetingsRepository.create({
      ownerId,
      members: [member],
    });

    return await this.meetingsRepository.save(meeting);
  }

  async addMember(meetingId: string, memberData: CreateMemberDto) {
    let meeting: Meeting;

    try {
      meeting = await this.getById(meetingId);
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
    await this.membersService.deleteByUserId(userId);
    return await this.getById(meetingId);
  }

  async endMeeting(id: string) {
    return await this.meetingsRepository.delete({ id });
  }
}
