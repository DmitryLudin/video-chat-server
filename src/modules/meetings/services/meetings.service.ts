import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateMeetingDto, UpdateMeetingDto } from 'src/modules/meetings/dto';
import { Meeting } from 'src/modules/meetings/entities';
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
    const { ownerId, memberIds, ...otherData } = meetingData;
    let members = [{ id: ownerId }];

    if (memberIds?.length > 0) {
      members = [
        ...members,
        ...memberIds.map((memberId) => ({ id: memberId })),
      ];
    }

    const meeting = this.meetingsRepository.create({
      ...otherData,
      owner: ownerId as unknown,
      members,
    });

    return await this.meetingsRepository.save(meeting);
  }

  async update(id: string, meetingData: UpdateMeetingDto) {
    const meeting = await this.getById(id);
    const { ownerId, memberIds, ...otherData } = meetingData;
    let members = meeting.members as unknown[];

    if (memberIds?.length > 0) {
      members = [
        ...members,
        ...memberIds.map((memberId) => ({ id: memberId })),
      ];
    }

    await this.meetingsRepository.save({
      ...meeting,
      ...otherData,
      owner: (ownerId || meeting.owner) as unknown,
      members,
    });
  }

  async endMeeting(id: string) {
    return await this.meetingsRepository.delete({ id });
  }
}
