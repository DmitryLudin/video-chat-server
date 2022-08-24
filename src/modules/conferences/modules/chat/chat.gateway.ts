import { ClassSerializerInterceptor, UseInterceptors } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
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
import { AddMessageDto } from 'src/modules/conferences/modules/chat/dto';

@WebSocketGateway({ cors, namespace: 'conferences/chat' })
export class ChatGateway implements OnGatewayConnection {
  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket) {
    try {
      const messages = await this.chatService.connect(client);

      client.emit(ChatEventEnum.GET_MESSAGES, this.deserializeData(messages));
    } catch (error) {
      console.log(error);
      client.emit(ChatEventEnum.ERROR, { error });
      client.disconnect();
    }
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @SubscribeMessage(ChatEventEnum.SEND_MESSAGE)
  async handleAddMessage(
    @MessageBody() addMessageData: AddMessageDto,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<Message>> {
    const message = await this.chatService.addMessage(addMessageData);

    console.log('add message', client.id);
    client
      .to(addMessageData.roomId)
      .emit(ChatEventEnum.GET_MESSAGE, this.deserializeData(message));
    return {
      event: ChatEventEnum.GET_MESSAGE,
      data: message,
    };
  }

  private deserializeData<T extends object>(data: T): T {
    return instanceToPlain(data) as T;
  }
}
