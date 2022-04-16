import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateMeetingDto, UpdateMembersDto } from 'src/modules/meetings/dto';
import { Meeting } from 'src/modules/meetings/entities';
import { User } from 'src/modules/users/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MeetingsService {
  constructor(
    @InjectRepository(Meeting)
    private readonly meetingsRepository: Repository<Meeting>,
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
    const members = [{ id: ownerId } as unknown as User];
    const meeting = this.meetingsRepository.create({ ownerId, members });
    return await this.meetingsRepository.save(meeting);
  }

  async updateMembers(id: string, meetingData: UpdateMembersDto) {
    const meeting = await this.getById(id);

    return await this.meetingsRepository.save({
      ...meeting,
      members: [...meeting.members, ...meetingData.members],
    });
  }

  async endMeeting(id: string) {
    return await this.meetingsRepository.delete({ id });
  }
}
