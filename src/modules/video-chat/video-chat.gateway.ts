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
import { instanceToPlain } from 'class-transformer';
import { Server, Socket } from 'socket.io';
import { cors } from 'src/constants/cors';
import { Meeting, Message } from 'src/modules/meetings/entities';
import { JoinMeetingDto, LeaveMeetingDto } from 'src/modules/video-chat/dto';
import { VideoChatService } from 'src/modules/video-chat/video-chat.service';
import { VideoChatAction } from 'src/modules/video-chat/constants/actions.enum';

@WebSocketGateway({
  cors,
})
export class VideoChatGateway implements OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server;

  constructor(private readonly videoChatService: VideoChatService) {}

  async onModuleInit() {
    this.videoChatService.clearConnectedUsers();
  }

  async handleDisconnect(client: Socket) {
    await this.videoChatService.disconnectUser(client);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @SubscribeMessage(VideoChatAction.JOIN_MEETING)
  async handleJoinMeeting(
    @MessageBody() meetingData: JoinMeetingDto,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<{ meeting: Meeting; messages: Message[] }>> {
    try {
      const { meeting, messages } = await this.videoChatService.joinMeeting(
        client,
        meetingData,
      );

      client.join(meeting.id);
      client.to(meeting.id).emit(VideoChatAction.JOIN_MEETING, {
        meeting: this.deserializeData(meeting),
      });
      return {
        event: VideoChatAction.JOIN_MEETING,
        data: { meeting, messages },
      };
    } catch (error) {
      console.log(error);
    }
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @SubscribeMessage(VideoChatAction.LEAVE_MEETING)
  async handleLeaveMeeting(
    @MessageBody() leaveMeetingData: LeaveMeetingDto,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<{ meeting: Meeting }>> {
    const meeting = await this.videoChatService.leaveMeeting(leaveMeetingData);

    client.leave(meeting.id);
    client.to(meeting.id).emit(VideoChatAction.LEAVE_MEETING, {
      meeting: this.deserializeData(meeting),
    });
    return {
      event: VideoChatAction.LEAVE_MEETING,
      data: { meeting },
    };
  }

  private deserializeData<T extends object>(data: T): T {
    return instanceToPlain(data) as T;
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
