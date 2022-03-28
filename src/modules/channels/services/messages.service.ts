import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AddMessageDto } from 'src/modules/channels/dto';
import { Message } from 'src/modules/channels/entities';
import { Repository } from 'typeorm';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
  ) {}

  async getAllByChannelId(channelId: number) {
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
