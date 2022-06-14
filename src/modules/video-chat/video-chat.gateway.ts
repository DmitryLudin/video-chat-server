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
import {
  AddMessageDto,
  SendTrackPauseResumeDto,
} from 'src/modules/video-chat/dto';
import { Member, Message } from 'src/modules/video-chat/entities';
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
      const { room, messages, mediaData } = await this.videoChatService.connect(
        client,
      );

      client.to(room.id).emit(VideoChatAction.MEMBERS, {
        room: this.deserializeData(room),
      });
      client.emit(VideoChatAction.JOIN_ROOM, {
        room: this.deserializeData(room),
        messages: this.deserializeData(messages),
        mediaData,
      });
      client.join(room.id);
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
      const { isRoomClosed, room } = await this.videoChatService.disconnect(
        client,
      );
      client.leave(room.id);

      if (isRoomClosed) {
        return client.to(room.id).emit(VideoChatAction.CLOSE_ROOM, {
          isRoomClosed: true,
        });
      }

      return client.to(room.id).emit(VideoChatAction.LEAVE_ROOM, {
        room: this.deserializeData(room),
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
    client.to(addMessageData.roomId).emit(VideoChatAction.MESSAGES, {
      messages: this.deserializeData(messages),
    });
    return {
      event: VideoChatAction.MESSAGES,
      data: { messages },
    };
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @SubscribeMessage(VideoChatAction.TRACKS)
  async handelNewTracks(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<
    WsResponse<{ tracks: Array<{ producerId: string; memberId: string }> }>
  > {
    const tracks = this.videoChatService.getMemberTracks(data.roomId);

    console.log('get producer ids', client.id);
    client.to(data.roomId).emit(VideoChatAction.TRACKS, {
      tracks,
    });
    return {
      event: VideoChatAction.TRACKS,
      data: { tracks },
    };
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @SubscribeMessage(VideoChatAction.TRACK_PAUSE)
  async handleSendTrackPause(
    @MessageBody()
    data: SendTrackPauseResumeDto,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<{ members: Member[] }>> {
    const { room } = await this.videoChatService.sendTrackPause(data);

    console.log('send track pause', client.id);
    client.to(data.roomId).emit(VideoChatAction.MEMBERS, {
      members: this.deserializeData(room.members),
    });
    return {
      event: VideoChatAction.MEMBERS,
      data: { members: room.members },
    };
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @SubscribeMessage(VideoChatAction.TRACK_RESUME)
  async handleSendTrackResume(
    @MessageBody()
    data: SendTrackPauseResumeDto,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<{ members: Member[] }>> {
    const { room } = await this.videoChatService.sendTrackResume(data);

    console.log('send track resume', client.id);
    client.to(data.roomId).emit(VideoChatAction.MEMBERS, {
      members: this.deserializeData(room.members),
    });
    return {
      event: VideoChatAction.MEMBERS,
      data: { members: room.members },
    };
  }

  private deserializeData<T extends object>(data: T): T {
    return instanceToPlain(data) as T;
  }
}
