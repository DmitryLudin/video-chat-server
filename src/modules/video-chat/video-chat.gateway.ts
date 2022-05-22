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
import { TProducerId } from 'src/modules/video-chat/types';
import { VideoChatService } from 'src/modules/video-chat/video-chat.service';
import { VideoChatAction } from 'src/modules/video-chat/constants/actions.enum';
import { WebRtcService } from 'src/modules/webrtc/webrtc.service';

@WebSocketGateway({
  cors,
})
export class VideoChatGateway
  implements OnGatewayDisconnect, OnGatewayConnection
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly videoChatService: VideoChatService,
    private readonly webRtcService: WebRtcService,
  ) {
    webRtcService
      .createWorkers()
      .then(() => console.log('workers created'))
      .catch((error) => console.log(error));
  }

  async handleConnection(client: Socket) {
    try {
      const {
        meeting,
        messages,
        webRtcRouter,
        transportProduceData,
        transportConsumeData,
      } = await this.videoChatService.connect(client);

      client.join(meeting.id);
      client.to(meeting.id).emit(VideoChatAction.MEMBERS, {
        meeting: this.deserializeData(meeting),
      });
      client.emit(VideoChatAction.JOIN_MEETING, {
        meeting: this.deserializeData(meeting),
        messages: this.deserializeData(messages),
        routerRtpCapabilities: webRtcRouter.rtpCapabilities,
        transportProduceData,
        transportConsumeData,
      });
    } catch (error) {
      console.log(error);
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

  @UseInterceptors(ClassSerializerInterceptor)
  @SubscribeMessage(VideoChatAction.NEW_PRODUCERS)
  async handelNewProducers(
    @MessageBody() data: { meetingId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<{ producers: Array<{ id: TProducerId }> }>> {
    const producers = this.videoChatService.getProducers(data.meetingId);

    console.log('get producer ids', client.id);
    client.to(data.meetingId).emit(VideoChatAction.NEW_PRODUCERS, {
      producers,
    });
    return {
      event: VideoChatAction.NEW_PRODUCERS,
      data: { producers },
    };
  }

  private deserializeData<T extends object>(data: T): T {
    return instanceToPlain(data) as T;
  }
}
