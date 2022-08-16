import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import {
  AddMessageDto,
  GetMessagesDto,
} from 'src/modules/conferences/modules/chat/dto';
import { MessagesService } from 'src/modules/conferences/modules/messages/messages.service';

@Injectable()
export class ChatService {
  constructor(private readonly messagesService: MessagesService) {}

  async addMessage(addMessageData: AddMessageDto) {
    try {
      return await this.messagesService.addMessage(addMessageData);
    } catch (error) {
      console.log('add message', error);
      throw new WsException(error as object);
    }
  }

  async getAllRoomMessages(getMessagedData: GetMessagesDto) {
    try {
      return await this.messagesService.getAllByRoomId(getMessagedData.roomId);
    } catch (error) {
      console.log('get messages', error);
      throw new WsException(error as object);
    }
  }
}
