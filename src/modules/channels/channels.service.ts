import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AddMessageDto,
  CreateChannelDto,
  UpdateChannelDto,
} from 'src/modules/channels/dto';
import { Message, Channel } from 'src/modules/channels/entities';
import { Repository } from 'typeorm';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelsRepository: Repository<Channel>,
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
  ) {}

  async getById(id: string) {
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

  async getMessages(channelId: string) {
    return await this.messagesRepository.find({
      where: { channelId },
    });
  }

  async addMessage(messageData: AddMessageDto) {
    const { userId, replyMessageId, ...otherData } = messageData;

    const message = await this.messagesRepository.create({
      ...otherData,
      author: userId as unknown,
      reply: replyMessageId as unknown,
    });

    return await this.messagesRepository.save(message);
  }

  async create(channelData: CreateChannelDto) {
    const channel = await this.channelsRepository.create({
      ...channelData,
    });

    return await this.channelsRepository.save(channel);
  }

  async update(id: string, channelData: UpdateChannelDto) {
    const channel = await this.getById(id);

    if (!channel) {
      throw new NotFoundException(`There is no channel under id ${id}`);
    }

    return await this.channelsRepository.save({ ...channel, ...channelData });
  }

  async startMeeting(id: string) {
    return await this.channelsRepository.update(id, { isMeetingStarted: true });
  }

  async endMeeting(id: string) {
    return await this.channelsRepository.update(id, {
      isMeetingStarted: false,
    });
  }
}
