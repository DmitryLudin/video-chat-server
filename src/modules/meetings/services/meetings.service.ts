import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateMeetingDto } from 'src/modules/meetings/dto';
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
      throw new NotFoundException(`Встреча с таким id ${id} не найдена`);
    }

    return meeting;
  }

  async create(meetingData: CreateMeetingDto) {
    const { ownerId } = meetingData;
    const meeting = this.meetingsRepository.create({
      ownerId,
      members: [],
    });

    return await this.meetingsRepository.save(meeting);
  }

  async addMember(meetingId: string, userId: number) {
    const meeting = await this.getById(meetingId);

    try {
      const member = await this.membersService.create({ userId });

      return await this.meetingsRepository.save({
        ...meeting,
        members: [...meeting.members, member],
      });
    } catch {
      return meeting;
    }
  }

  async deleteMember(meetingId: string, memberId: number) {
    await this.membersService.delete(memberId);
    return await this.getById(meetingId);
  }

  async endMeeting(id: string) {
    return await this.meetingsRepository.delete({ id });
  }
}
