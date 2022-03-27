import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthenticationService } from 'src/modules/authentication/authentication.service';
import { CHAT_ACTIONS } from 'src/modules/chat/constants/actions.enum';

@WebSocketGateway({
  allowEIO3: true,
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly authenticationService: AuthenticationService) {}

  @SubscribeMessage('login')
  async logIn(
    @MessageBody() data: { username: string },
    @ConnectedSocket() socket: Socket,
  ): Promise<string> {
    return 'Hello world!';
  }

  @SubscribeMessage(CHAT_ACTIONS.SEND_MESSAGE)
  handleMessage(
    @MessageBody() content: string,
    @ConnectedSocket() socket: Socket,
  ): string {
    return 'Hello world!';
  }
}
