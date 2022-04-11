import { OnModuleInit } from '@nestjs/common';
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
import { CreateChannelDto } from 'src/modules/channels/dto';
import {
  ChannelsService,
  MessagesService,
} from 'src/modules/channels/services';
import { ChatService } from 'src/modules/chat/chat.service';
import { ChatAction } from 'src/modules/chat/constants/actions.enum';
import {
  ConnectedUserService,
  JoinedChannelService,
} from 'src/modules/chat/services';

@WebSocketGateway()
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly channelsService: ChannelsService,
    private readonly connectedUserService: ConnectedUserService,
    private readonly joinedChannelService: JoinedChannelService,
    private readonly messagesService: MessagesService,
  ) {}

  async onModuleInit() {
    await this.connectedUserService.deleteAll();
    await this.joinedChannelService.deleteAll();
  }

  async handleConnection(socket: Socket) {
    try {
      const user = await this.chatService.getUserFromSocket(socket);
      const userChannels = await this.channelsService.getAllForUser(user.id);
      const channels = await this.channelsService.getAll();
      await this.connectedUserService.create({
        socketId: socket.id,
        userId: user.id,
      });
      socket.emit(ChatAction.GET_CHANNELS, { userChannels, channels });
    } catch (error) {
      socket.emit(ChatAction.DISCONNECT_USER, error);
      socket.disconnect();
    }
  }

  async handleDisconnect(socket: Socket) {
    await this.connectedUserService.deleteBySocketId(socket.id);
    socket.disconnect();
  }

  @SubscribeMessage(ChatAction.CREATE_CHANNEL)
  async onCreateChannel(@MessageBody() channelData: CreateChannelDto) {
    await this.channelsService.create(channelData);

    for (const userId of channelData.memberIds) {
      const connectedUsers = await this.connectedUserService.findAllByUserId(
        userId,
      );
      const userChannels = await this.channelsService.getAllForUser(userId);

      for (const connectedUser of connectedUsers) {
        this.server
          .to(connectedUser.socketId)
          .emit(ChatAction.GET_ALL_USER_CHANNELS, userChannels);
      }
    }
  }

  @SubscribeMessage(ChatAction.SEND_MESSAGE)
  async handleMessage(
    @MessageBody() content: string,
    @ConnectedSocket() socket: Socket,
  ): Promise<string> {
    return 'Hello world!';
  }
}
