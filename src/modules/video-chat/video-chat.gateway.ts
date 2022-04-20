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
import { JoinMeetingDto } from 'src/modules/video-chat/dto';
import { VideoChatService } from 'src/modules/video-chat/video-chat.service';
import { VideoChatAction } from 'src/modules/video-chat/constants/actions.enum';

@WebSocketGateway({
  cors,
})
export class VideoChatGateway
  implements OnGatewayDisconnect, OnGatewayConnection, OnModuleInit
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly videoChatService: VideoChatService) {}

  async onModuleInit() {
    this.videoChatService.clearAllConnections();
  }

  async handleConnection(client: Socket) {
    try {
      await this.videoChatService.getUserFromSocket(client);
      console.log('connected', client.id);
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const meeting = await this.videoChatService.leaveMeeting(client);
    console.log('disconnected', client.id, meeting);
    client.leave(meeting.id);
    client.to(meeting.id).emit(VideoChatAction.LEAVE_MEETING, {
      meeting: this.deserializeData(meeting),
    });
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @SubscribeMessage(VideoChatAction.JOIN_MEETING)
  async handleJoinMeeting(
    @MessageBody() meetingData: JoinMeetingDto,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<{ meeting: Meeting; messages: Message[] }>> {
    const { meeting, messages } = await this.videoChatService.joinMeeting(
      client,
      meetingData,
    );
    console.log('joined', client.id, meeting);
    client.join(meeting.id);
    client.to(meeting.id).emit(VideoChatAction.JOIN_MEETING, {
      meeting: this.deserializeData(meeting),
    });
    return {
      event: VideoChatAction.JOIN_MEETING,
      data: { meeting, messages },
    };
  }

  private deserializeData<T extends object>(data: T): T {
    return instanceToPlain(data) as T;
  }
}
