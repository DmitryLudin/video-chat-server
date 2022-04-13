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
import {
  MeetingsService,
  MessagesService,
} from 'src/modules/meetings/services';
import { JoinMeetingDto } from 'src/modules/video-chat/dto';
import { VideoChatService } from 'src/modules/video-chat/video-chat.service';
import { VideoChatAction } from 'src/modules/video-chat/constants/actions.enum';
import { ConnectedUsersService } from 'src/modules/video-chat/services';

@WebSocketGateway()
export class VideoChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly videoChatService: VideoChatService,
    private readonly meetingsService: MeetingsService,
    private readonly connectedUsersService: ConnectedUsersService,
    private readonly messagesService: MessagesService,
  ) {}

  async onModuleInit() {
    await this.connectedUsersService.deleteAll();
  }

  async handleConnection(client: Socket) {
    try {
      // Получаем юзера если он аутентифицирован
      const user = await this.videoChatService.getUserFromSocket(client);
      // Добавляем юзера к присоединенным в базу
      await this.connectedUsersService.create({
        socketId: client.id,
        userId: user.id,
      });
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    await this.connectedUsersService.deleteBySocketId(client.id);
    client.disconnect();
  }

  @SubscribeMessage(VideoChatAction.JOIN_MEETING)
  async handleJoinMeeting(
    @MessageBody() meetingData: JoinMeetingDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const meeting = await this.meetingsService.getById(meetingData.meetingId);
      const messages = await this.messagesService.getAllByMeetingId(meeting.id);
      client.join(meeting.id);
      client.emit(VideoChatAction.MESSAGES, messages);
    } catch (error) {
      console.log(error);
    }
  }

  // @SubscribeMessage(VideoChatAction.CREATE_MEETING)
  // async onCreateMeeting(
  //   @MessageBody() meetingData: CreateMeetingDto,
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   await this.meetingsService.create(meetingData);
  //
  //   for (const userId of channelData.memberIds) {
  //     const connectedUsers = await this.connectedUserService.findAllByUserId(
  //       userId,
  //     );
  //     const userChannels = await this.channelsService.getAllForUser(userId);
  //
  //     for (const connectedUser of connectedUsers) {
  //       this.server
  //         .to(connectedUser.socketId)
  //         .emit(ChatAction.GET_ALL_USER_CHANNELS, userChannels);
  //     }
  //   }
  // }

  // @SubscribeMessage(ChatAction.SEND_MESSAGE)
  // async handleMessage(
  //   @MessageBody() content: string,
  //   @ConnectedSocket() socket: Socket,
  // ): Promise<string> {
  //   return 'Hello world!';
  // }
}
