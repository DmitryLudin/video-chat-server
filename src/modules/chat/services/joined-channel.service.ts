import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateJoinedChannelDto } from 'src/modules/chat/dto';
import { JoinedChannel } from 'src/modules/chat/entities';
import { Repository } from 'typeorm';

@Injectable()
export class JoinedChannelService {
  constructor(
    @InjectRepository(JoinedChannel)
    private readonly joinedChannelRepository: Repository<JoinedChannel>,
  ) {}

  async create(joinedChannelData: CreateJoinedChannelDto) {
    const { channelId, userId, ...otherData } = joinedChannelData;

    const joinedChannel = this.joinedChannelRepository.create({
      ...otherData,
      channel: channelId as unknown,
      user: userId as unknown,
    });

    return this.joinedChannelRepository.save(joinedChannel);
  }

  async findAllByUserId(userId: number) {
    return this.joinedChannelRepository.find({
      where: { user: userId as unknown },
    });
  }

  async findAllByChannelId(channelId: number) {
    return this.joinedChannelRepository.find({
      where: { channel: channelId as unknown },
    });
  }

  async deleteBySocketId(socketId: string) {
    return this.joinedChannelRepository.delete({ socketId });
  }

  async deleteAll() {
    await this.joinedChannelRepository.clear();
  }
}
