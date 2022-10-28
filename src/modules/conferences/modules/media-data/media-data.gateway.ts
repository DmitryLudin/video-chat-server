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
import { Socket, Server } from 'socket.io';
import { cors } from 'src/constants/cors';
import { MediaDataEventEnum } from 'src/modules/conferences/modules/media-data/constants/media-data-event.enum';
import { MediaDataService } from 'src/modules/conferences/modules/media-data/media-data.service';
import { ConferenceGatewayHelperService } from 'src/modules/conferences/services';
import {
  IActiveSpeakerDto,
  IGetMemberMediaDataDto,
  IPauseResumeMediaStreamProducerDto,
} from 'src/modules/conferences/types/media-data.types';

@WebSocketGateway({ cors, namespace: 'conferences/media-data' })
export class MediaDataGateway
  implements OnGatewayDisconnect, OnGatewayConnection
{
  @WebSocketServer()
  server: Server;

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

      await this.mediaDataService.createActiveSpeakerObserver(
        room.id,
        (data: IActiveSpeakerDto) => {
          this.server.to(room.id).emit(MediaDataEventEnum.ACTIVE_SPEAKER, data);
        },
      );
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

      if (isRoomClosed) {
        this.mediaDataService.delete(room.id);
        return client.leave(room.id);
      }

      const member = room.members.find((member) => member.user.id === user.id);

      this.mediaDataService.deleteMediaStream(room.id, member.id);

      client
        .to(room.id)
        .emit(MediaDataEventEnum.CLOSE_STREAM, { memberId: member.id });
      client.leave(room.id);
    } catch (error) {
      client.emit(MediaDataEventEnum.ERROR, { error });
      client.disconnect();
    }
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @SubscribeMessage(MediaDataEventEnum.REMOTE_MEDIA_DATA)
  async handelNewTracks(@ConnectedSocket() client: Socket): Promise<
    WsResponse<{
      membersMediaData: Array<IGetMemberMediaDataDto>;
    }>
  > {
    const { room } = await this.helperService.getUserAndRoomFromSocket(client);
    const membersMediaData = this.mediaDataService.getMembersMediaData(room.id);

    console.log('get stream producer ids', client.id);
    client
      .to(room.id)
      .emit(MediaDataEventEnum.REMOTE_MEDIA_DATA, { membersMediaData });
    return {
      event: MediaDataEventEnum.REMOTE_MEDIA_DATA,
      data: { membersMediaData },
    };
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @SubscribeMessage(MediaDataEventEnum.STREAM_PAUSE)
  async handleStreamPause(
    @MessageBody() data: IPauseResumeMediaStreamProducerDto,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<IPauseResumeMediaStreamProducerDto>> {
    await this.mediaDataService.pauseMediaStreamProducer(data);

    client.to(data.roomId).emit(MediaDataEventEnum.STREAM_PAUSE, data);
    return {
      event: MediaDataEventEnum.STREAM_PAUSE,
      data,
    };
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @SubscribeMessage(MediaDataEventEnum.STREAM_RESUME)
  async handleStreamResume(
    @MessageBody() data: IPauseResumeMediaStreamProducerDto,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<IPauseResumeMediaStreamProducerDto>> {
    await this.mediaDataService.resumeMediaStreamProducer(data);

    client.to(data.roomId).emit(MediaDataEventEnum.STREAM_RESUME, data);
    return {
      event: MediaDataEventEnum.STREAM_RESUME,
      data,
    };
  }
}
