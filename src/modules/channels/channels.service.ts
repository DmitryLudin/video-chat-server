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

  async create(channelData: CreateChannelDto) {
    const { ownerId, ...otherData } = channelData;

    const channel = this.channelsRepository.create({
      ...otherData,
      owner: ownerId as unknown,
      members: [{ id: ownerId }] as unknown[],
    });

    await this.channelsRepository.save(channel);
  }

  async update(id: number, channelData: UpdateChannelDto) {
    const channel = await this.getById(id);
    const { ownerId, members, ...otherData } = channelData;

    await this.channelsRepository.save({
      ...channel,
      ...otherData,
      owner: (ownerId || channel.owner) as unknown,
      members: [
        ...channel.members,
        ...(members.map((memberId) => ({ id: memberId })) as unknown[]),
      ],
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

  // Методы сообщениий
  async getMessages(channelId: number) {
    return await this.messagesRepository.find({
      where: { channelId },
      relations: ['author', 'reply'],
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
}
