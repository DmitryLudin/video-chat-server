import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AddMessageDto } from 'src/modules/conferences/modules/chat/dto';
import { MessagesService } from 'src/modules/conferences/modules/messages/messages.service';
import { ConferenceGatewayHelperService } from 'src/modules/conferences/services';

@Injectable()
export class ChatService {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly helperService: ConferenceGatewayHelperService,
  ) {}

  async connect(client: Socket) {
    try {
      const { room } = await this.helperService.getUserAndRoomFromSocket(
        client,
      );

      client.join(room.id);
      return await this.messagesService.getAllByRoomId(room.id);
    } catch (error) {
      console.log('connect chat', error);
      throw new WsException(error as object);
    }
  }

  async addMessage(addMessageData: AddMessageDto) {
    try {
      return await this.messagesService.addMessage(addMessageData);
    } catch (error) {
      console.log('add message', error);
      throw new WsException(error as object);
    }
  }
}
