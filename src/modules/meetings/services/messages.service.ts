import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AddMessageDto } from 'src/modules/meetings/dto';
import { Message } from 'src/modules/meetings/entities';
import { Repository } from 'typeorm';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
  ) {}

  async getById(messageId: string) {
    return await this.messagesRepository.findOne({
      where: { id: messageId },
      relations: ['author', 'reply', 'reply.author'],
    });
  }

  async getAllByMeetingId(meetingId: string) {
    return await this.messagesRepository.find({
      where: { meetingId },
      relations: ['author', 'reply', 'reply.author'],
      order: { createdAt: 'ASC' },
    });
  }

  async addMessage(messageData: AddMessageDto) {
    const { userId, ...otherData } = messageData;
    const message = this.messagesRepository.create({
      ...otherData,
      authorId: userId,
    });
    const savedMessage = await this.messagesRepository.save(message);

    return await this.getById(savedMessage.id);
  }
}
