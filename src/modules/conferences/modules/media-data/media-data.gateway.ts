import { ClassSerializerInterceptor, UseInterceptors } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WsResponse,
} from '@nestjs/websockets';
import { MediaKind } from 'mediasoup/node/lib/RtpParameters';
import { Socket } from 'socket.io';
import { cors } from 'src/constants/cors';
import { MediaDataEventEnum } from 'src/modules/conferences/modules/media-data/constants/media-data-event.enum';
import { MediaDataService } from 'src/modules/conferences/modules/media-data/media-data.service';
import { ConferenceGatewayHelperService } from 'src/modules/conferences/services';

@WebSocketGateway({ cors, namespace: 'conferences/media-data' })
export class MediaDataGateway
  implements OnGatewayDisconnect, OnGatewayConnection
{
  constructor(
    private readonly helperService: ConferenceGatewayHelperService,
    private readonly mediaDataService: MediaDataService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const { room, user } = await this.helperService.getUserAndRoomFromSocket(
        client,
      );
      const member = room.members.find((member) => member.user.id === user.id);
      const mediaData = {
        routerRtpCapabilities:
          this.mediaDataService.getRoomRouterRtpCapabilities(room.id),
        transports: this.mediaDataService.getMediaStreamTransports(
          room.id,
          member.id,
        ),
      };

      client.emit(MediaDataEventEnum.GET_MEDIA_DATA, {
        mediaData,
        roomId: room.id,
        memberId: member.id,
      });
      client.join(room.id);
    } catch (error) {
      console.log(error);
      client.emit(MediaDataEventEnum.ERROR, { error });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const { room, user } = await this.helperService.getUserAndRoomFromSocket(
        client,
      );
      const isRoomClosed = room.ownerId === user.id;

      client.leave(room.id);

      if (isRoomClosed) {
        return this.mediaDataService.delete(room.id);
      }

      const member = room.members.find((member) => member.user.id === user.id);

      return this.mediaDataService.deleteMediaStream(room.id, member.id);
    } catch (error) {
      client.emit(MediaDataEventEnum.ERROR, { error });
      client.disconnect();
    }
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @SubscribeMessage(MediaDataEventEnum.NEW_TRACKS)
  async handelNewTracks(@ConnectedSocket() client: Socket): Promise<
    WsResponse<{
      tracks: Array<{
        producerId: string;
        memberId: string;
        mediaKind: MediaKind;
      }>;
    }>
  > {
    const { room } = await this.helperService.getUserAndRoomFromSocket(client);
    const tracks = this.mediaDataService.getMediaStreamTracks(room.id);

    console.log('get stream producer ids', client.id);
    client.to(room.id).emit(MediaDataEventEnum.NEW_TRACKS, { tracks });
    return {
      event: MediaDataEventEnum.NEW_TRACKS,
      data: { tracks },
    };
  }
}
