import { ClassSerializerInterceptor, UseInterceptors } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WsResponse,
} from '@nestjs/websockets';
import { instanceToPlain } from 'class-transformer';
import { Socket } from 'socket.io';
import { cors } from 'src/constants/cors';
import { RoomEventEnum } from 'src/modules/conferences/constants/room-event.enum';
import { Member } from 'src/modules/conferences/entities';
import { GatewayHelperService } from 'src/modules/conferences/services';
import { IPauseResumeMediaStreamProducerDto } from 'src/modules/conferences/types/media-data.types';

@WebSocketGateway({ cors })
export class ConferencesGateway
  implements OnGatewayDisconnect, OnGatewayConnection
{
  constructor(private readonly service: GatewayHelperService) {}

  async handleConnection(client: Socket) {
    try {
      const room = await this.service.connect(client);

      client
        .to(room.id)
        .emit(RoomEventEnum.MEMBERS, this.deserializeData(room.members));
      client.emit(RoomEventEnum.JOIN_ROOM, this.deserializeData(room));
      client.join(room.id);
    } catch (error) {
      console.log(error);
      client.emit(RoomEventEnum.ERROR, { error });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const { isRoomClosed, room } = await this.service.disconnect(client);
      client.leave(room.id);

      if (isRoomClosed) {
        return client.to(room.id).emit(RoomEventEnum.CLOSE_ROOM, {
          isRoomClosed: true,
        });
      }

      return client
        .to(room.id)
        .emit(RoomEventEnum.LEAVE_ROOM, this.deserializeData(room.members));
    } catch (error) {
      client.emit(RoomEventEnum.ERROR, { error });
      client.disconnect();
    }
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @SubscribeMessage(RoomEventEnum.TRACKS)
  async handelNewTracks(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<
    WsResponse<{ tracks: Array<{ producerId: string; memberId: string }> }>
  > {
    const tracks = this.service.getMediaStreamTracks(data.roomId);

    console.log('get stream producer ids', client.id);
    client.to(data.roomId).emit(RoomEventEnum.TRACKS, { tracks });
    return {
      event: RoomEventEnum.TRACKS,
      data: { tracks },
    };
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @SubscribeMessage(RoomEventEnum.TRACK_PAUSE)
  async handleSendTrackPause(
    @MessageBody()
    data: IPauseResumeMediaStreamProducerDto,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<{ members: Member[] }>> {
    const { room } = await this.service.mediaStreamPause(data);

    console.log('media stream producer pause', client.id);
    client.to(data.roomId).emit(RoomEventEnum.MEMBERS, {
      members: this.deserializeData(room.members),
    });
    return {
      event: RoomEventEnum.MEMBERS,
      data: { members: room.members },
    };
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @SubscribeMessage(RoomEventEnum.TRACK_RESUME)
  async handleSendTrackResume(
    @MessageBody()
    data: IPauseResumeMediaStreamProducerDto,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<{ members: Member[] }>> {
    const { room } = await this.service.mediaStreamResume(data);

    console.log('media stream producer resume', client.id);
    client.to(data.roomId).emit(RoomEventEnum.MEMBERS, {
      members: this.deserializeData(room.members),
    });
    return {
      event: RoomEventEnum.MEMBERS,
      data: { members: room.members },
    };
  }

  private deserializeData<T extends object>(data: T): T {
    return instanceToPlain(data) as T;
  }
}
