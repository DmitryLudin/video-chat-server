import { ClassSerializerInterceptor, UseInterceptors } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WsResponse,
} from '@nestjs/websockets';
import { instanceToPlain } from 'class-transformer';
import { Socket } from 'socket.io';
import { cors } from 'src/constants/cors';
import { Message } from 'src/modules/conferences/entities';
import { ChatService } from 'src/modules/conferences/modules/chat/chat.service';
import { ChatEventEnum } from 'src/modules/conferences/modules/chat/constants/chat-event.enum';
import {
  AddMessageDto,
  GetMessagesDto,
} from 'src/modules/conferences/modules/chat/dto';

@WebSocketGateway({ cors, namespace: 'chat' })
export class ChatGateway {
  constructor(private readonly chatService: ChatService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @SubscribeMessage(ChatEventEnum.SEND_MESSAGE)
  async handleAddMessage(
    @MessageBody() addMessageData: AddMessageDto,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<{ message: Message }>> {
    const message = await this.chatService.addMessage(addMessageData);

    console.log('add message', client.id);
    client.to(addMessageData.roomId).emit(ChatEventEnum.GET_MESSAGE, {
      message: this.deserializeData(message),
    });
    return {
      event: ChatEventEnum.GET_MESSAGE,
      data: { message },
    };
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @SubscribeMessage(ChatEventEnum.GET_MESSAGES)
  async handleGetMessages(
    @MessageBody() getMessagesData: GetMessagesDto,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<{ messages: Message[] }>> {
    const messages = await this.chatService.getAllRoomMessages(getMessagesData);

    console.log('get messages', client.id);
    client.to(getMessagesData.roomId).emit(ChatEventEnum.GET_MESSAGES, {
      messages: this.deserializeData(messages),
    });
    return {
      event: ChatEventEnum.GET_MESSAGES,
      data: { messages },
    };
  }

  private deserializeData<T extends object>(data: T): T {
    return instanceToPlain(data) as T;
  }
}
