import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from 'src/modules/conferences/entities';
import { AddMessageDto } from 'src/modules/conferences/modules/chat/dto';
import { Repository } from 'typeorm';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
  ) {}

  async getById(id: string) {
    return await this.messagesRepository.findOne({ where: { id } });
  }

  async getAllByRoomId(roomId: string) {
    return await this.messagesRepository.find({
      where: { roomId },
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

    await this.messagesRepository.save(message);

    return await this.getById(message.id);
  }

  async deleteAllByRoomId(roomId: string) {
    return this.messagesRepository.delete({ roomId });
  }
}
