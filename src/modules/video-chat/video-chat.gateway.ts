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
import { instanceToPlain } from 'class-transformer';
import { Server, Socket } from 'socket.io';
import { cors } from 'src/constants/cors';
import { AddMessageDto } from 'src/modules/meetings/dto';
import { Message } from 'src/modules/meetings/entities';
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
    try {
      const { meeting, messages } = await this.videoChatService.connect(client);

      client.join(meeting.id);
      client.to(meeting.id).emit(VideoChatAction.JOIN_MEETING, {
        meeting: this.deserializeData(meeting),
        messages: this.deserializeData(messages),
      });
      client.emit(VideoChatAction.JOIN_MEETING, {
        meeting: this.deserializeData(meeting),
        messages: this.deserializeData(messages),
      });
    } catch (error) {
      client.emit(VideoChatAction.ERROR, {
        error,
      });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const { isMeetingOver, meeting } = await this.videoChatService.disconnect(
        client,
      );
      client.leave(meeting.id);

      if (isMeetingOver) {
        return client.to(meeting.id).emit(VideoChatAction.END_MEETING, {
          isMeetingOver: true,
        });
      }

      return client.to(meeting.id).emit(VideoChatAction.LEAVE_MEETING, {
        meeting: this.deserializeData(meeting),
      });
    } catch (error) {
      client.emit(VideoChatAction.ERROR, {
        error,
      });
    }
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @SubscribeMessage(VideoChatAction.SEND_MESSAGE)
  async handleAddMessage(
    @MessageBody() addMessageData: AddMessageDto,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<{ messages: Message[] }>> {
    const messages = await this.videoChatService.addMessage(
      client,
      addMessageData,
    );

    console.log('add message', client.id);
    client.to(addMessageData.meetingId).emit(VideoChatAction.MESSAGES, {
      messages: this.deserializeData(messages),
    });
    return {
      event: VideoChatAction.MESSAGES,
      data: { messages },
    };
  }
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

  private deserializeData<T extends object>(data: T): T {
    return instanceToPlain(data) as T;
  }
}
