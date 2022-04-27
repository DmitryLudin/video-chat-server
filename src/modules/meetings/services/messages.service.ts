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

  async getAllByMeetingId(meetingId: string) {
    return await this.messagesRepository.find({
      where: { meetingId },
      relations: ['author', 'reply', 'reply.author'],
      order: { createdAt: 'ASC' },
    });
  }

  async addMessage(messageData: AddMessageDto) {
    const { memberId, ...otherData } = messageData;
    const message = this.messagesRepository.create({
      ...otherData,
      authorId: memberId,
    });

    return await this.messagesRepository.save(message);
  }

  async deleteAllByMeetingId(meetingId: string) {
    return this.messagesRepository.delete({ meetingId });
  }
}
