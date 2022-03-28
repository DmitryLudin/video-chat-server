import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateChannelDto, UpdateChannelDto } from 'src/modules/channels/dto';
import { Channel } from 'src/modules/channels/entities';
import { Repository } from 'typeorm';
import { ArrayContains } from 'typeorm/find-options/operator/ArrayContains';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelsRepository: Repository<Channel>,
  ) {}

  async getById(id: number) {
    const channel = await this.channelsRepository.findOne({
      where: { id },
    });

    if (!channel) {
      throw new NotFoundException(`There is no channel under id ${id}`);
    }

    return channel;
  }

  async getAll() {
    return await this.channelsRepository.find();
  }

  async getAllForUser(userId: number) {
    return await this.channelsRepository.find({
      where: { members: ArrayContains([userId]) },
      relations: ['members', 'owner'],
    });
  }

  async create(channelData: CreateChannelDto) {
    const { ownerId, memberIds, ...otherData } = channelData;
    let members = [{ id: ownerId }];

    if (memberIds?.length > 0) {
      members = [
        ...members,
        ...memberIds.map((memberId) => ({ id: memberId })),
      ];
    }

    const channel = this.channelsRepository.create({
      ...otherData,
      owner: ownerId as unknown,
      members,
    });

    await this.channelsRepository.save(channel);
  }

  async update(id: number, channelData: UpdateChannelDto) {
    const channel = await this.getById(id);
    const { ownerId, memberIds, ...otherData } = channelData;
    let members = channel.members as unknown[];

    if (memberIds?.length > 0) {
      members = [
        ...members,
        ...memberIds.map((memberId) => ({ id: memberId })),
      ];
    }

    await this.channelsRepository.save({
      ...channel,
      ...otherData,
      owner: (ownerId || channel.owner) as unknown,
      members,
    });
  }

  // Методы управления созвоном
  async startMeeting(id: string) {
    return await this.channelsRepository.update(id, { isMeetingStarted: true });
  }

  async endMeeting(id: string) {
    return await this.channelsRepository.update(id, {
      isMeetingStarted: false,
    });
  }
}
