import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AuthenticationService } from 'src/modules/authentication/authentication.service';
import { AddMessageDto } from 'src/modules/conferences/modules/chat/dto';
import { MessagesService } from 'src/modules/conferences/modules/messages/messages.service';
import { RoomsService } from 'src/modules/conferences/modules/rooms/rooms.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly authenticationService: AuthenticationService,
    private readonly roomsService: RoomsService,
  ) {}

  async connect(client: Socket) {
    try {
      const user = await this.authenticationService.getUserFromSocket(client);
      const room = await this.roomsService.getByUserId(user.id);

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
