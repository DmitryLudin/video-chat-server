import {
  ClassSerializerInterceptor,
  OnModuleInit,
  UseInterceptors,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { cors } from 'src/constants/cors';
import { Meeting, Message } from 'src/modules/meetings/entities';
import {
  MeetingsService,
  MessagesService,
} from 'src/modules/meetings/services';
import { User } from 'src/modules/users/user.entity';
import { JoinMeetingDto } from 'src/modules/video-chat/dto';
import { VideoChatService } from 'src/modules/video-chat/video-chat.service';
import { VideoChatAction } from 'src/modules/video-chat/constants/actions.enum';
import { ConnectedUsersService } from 'src/modules/video-chat/services';

@WebSocketGateway({
  cors,
})
export class VideoChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server: Server;

  connectedUsers: Map<string, string> = new Map();

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
      console.log('connected', client.id);
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
    console.log('disconnect');
    await this.connectedUsersService.deleteBySocketId(client.id);
    client.disconnect();
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @SubscribeMessage(VideoChatAction.JOIN_MEETING)
  async handleJoinMeeting(
    @MessageBody() meetingData: JoinMeetingDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const connectedUsers =
        await this.connectedUsersService.findAllUsersBySocketId(client.id);
      const userIds = connectedUsers.map(
        (connectedUser) => connectedUser.user.id,
      );
      // const meeting = await this.meetingsService.update(meetingData.meetingId, {
      //   memberIds: userIds,
      // });
      // const messages = await this.messagesService.getAllByMeetingId(meeting.id);
      // console.log(meeting);
      // client.join(meeting.id);
      // return {
      //   event: VideoChatAction.JOIN_MEETING,
      //   data: { meeting, messages },
      // };
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
