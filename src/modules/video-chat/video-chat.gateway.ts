import { ClassSerializerInterceptor, UseInterceptors } from '@nestjs/common';
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
import { VideoChatService } from 'src/modules/video-chat/video-chat.service';
import { VideoChatAction } from 'src/modules/video-chat/constants/actions.enum';

@WebSocketGateway({
  cors,
})
export class VideoChatGateway
  implements OnGatewayDisconnect, OnGatewayConnection
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly videoChatService: VideoChatService) {}

  async handleConnection(client: Socket) {
    await this.videoChatService.connect(client);
  }

  async handleDisconnect(client: Socket) {
    await this.videoChatService.disconnect(client);
  }

  // @UseInterceptors(ClassSerializerInterceptor)
  // @SubscribeMessage(VideoChatAction.LEAVE_MEETING)
  // async handleLeaveMeeting(
  //   @MessageBody() meetingData: LeaveMeetingDto,
  //   @ConnectedSocket() client: Socket,
  // ): Promise<WsResponse<{ meeting: Meeting }>> {
  //   const meeting = await this.videoChatService.leaveMeeting(
  //     client,
  //     meetingData,
  //   );
  //
  //   console.log('leave', client.id);
  //   client.leave(meeting.id);
  //   client.to(meeting.id).emit(VideoChatAction.LEAVE_MEETING, {
  //     meeting: this.deserializeData(meeting),
  //   });
  //   return {
  //     event: VideoChatAction.LEAVE_MEETING,
  //     data: { meeting },
  //   };
  // }
  //
  // @UseInterceptors(ClassSerializerInterceptor)
  // @SubscribeMessage(VideoChatAction.END_MEETING)
  // async handleEndMeeting(
  //   @MessageBody() meetingData: EndMeetingDto,
  //   @ConnectedSocket() client: Socket,
  // ): Promise<WsResponse<{ isMeetingOver: boolean }>> {
  //   await this.videoChatService.endMeeting(meetingData);
  //   console.log('meeting over', client.id);
  //
  //   client.leave(meetingData.meetingId);
  //   client.to(meetingData.meetingId).emit(VideoChatAction.END_MEETING, {
  //     isMeetingOver: true,
  //   });
  //   return {
  //     event: VideoChatAction.END_MEETING,
  //     data: { isMeetingOver: true },
  //   };
  // }
}
