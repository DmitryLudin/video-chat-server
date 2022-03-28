import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtAuthenticationGuard } from 'src/modules/authentication/guards';
import { ChatService } from 'src/modules/chat/chat.service';
import { CHAT_ACTIONS } from 'src/modules/chat/constants/actions.enum';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(socket: Socket) {
    const author = await this.chatService.getUserFromSocket(socket);

    if (!author) {
      socket.disconnect();
    }
  }

  @UseGuards(JwtAuthenticationGuard)
  @SubscribeMessage(CHAT_ACTIONS.SEND_MESSAGE)
  async handleMessage(
    @MessageBody() content: string,
    @ConnectedSocket() socket: Socket,
  ): Promise<string> {
    return 'Hello world!';
  }
}
