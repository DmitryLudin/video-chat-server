import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { parse } from 'cookie';
import { Socket } from 'socket.io';
import { AuthenticationService } from 'src/modules/authentication/authentication.service';
import { MediaDataService } from 'src/modules/conferences/modules/media-data/media-data.service';
import { MembersService } from 'src/modules/conferences/modules/members/members.service';
import { RoomsService } from 'src/modules/conferences/modules/rooms/rooms.service';
import { IPauseResumeMediaStreamProducerDto } from 'src/modules/conferences/types/media-data.types';

@Injectable()
export class GatewayHelperService {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly roomsService: RoomsService,
    private readonly mediaDataService: MediaDataService,
    private readonly membersService: MembersService,
  ) {}

  async connect(client: Socket) {
    try {
      const user = await this.getUserFromSocket(client);
      const room = await this.roomsService.getByUserId(user.id);
      const member = room.members.find((member) => member.user.id === user.id);
      const mediaData = {
        routerRtpCapabilities:
          this.mediaDataService.getRoomRouterRtpCapabilities(room.id),
        transports: this.mediaDataService.getMediaStreamTransports(
          room.id,
          member.id,
        ),
      };

      console.log('connect', client.id);
      return {
        room,
        mediaData,
      };
    } catch (error) {
      console.log('join', error);
      throw new WsException(error as object);
    }
  }

  async disconnect(client: Socket) {
    try {
      const user = await this.getUserFromSocket(client);
      const room = await this.roomsService.getByUserId(user.id);
      const member = room.members.find((member) => member.user.id === user.id);
      console.log('disconnect', client.id);

      if (room.ownerId === user.id) {
        await this.roomsService.delete(room.id);
        this.mediaDataService.delete(room.id);
        return { isRoomClosed: true, room };
      }

      const updatedRoom = await this.roomsService.deleteMember(
        room.id,
        user.id,
      );
      this.mediaDataService.deleteMediaStream(room.id, member.id);
      return { room: updatedRoom };
    } catch (error) {
      console.log('disconnect', error);
      throw new WsException(error as object);
    }
  }

  getMediaStreamTracks(roomId: string) {
    return this.mediaDataService.getMediaStreamTracks(roomId);
  }

  async mediaStreamPause(data: IPauseResumeMediaStreamProducerDto) {
    try {
      await (data.kind === 'audio'
        ? this.membersService.disableAudio(data.memberId)
        : this.membersService.disableVideo(data.memberId));

      const room = await this.roomsService.getById(data.roomId);

      await this.mediaDataService.pauseMediaStreamProducer(data);

      return { room };
    } catch (error) {
      console.log('media stream producer pause', error);
      throw new WsException(error as object);
    }
  }

  async mediaStreamResume(data: IPauseResumeMediaStreamProducerDto) {
    try {
      await (data.kind === 'audio'
        ? this.membersService.enableAudio(data.memberId)
        : this.membersService.enableVideo(data.memberId));

      const room = await this.roomsService.getById(data.roomId);

      await this.mediaDataService.resumeMediaStreamProducer(data);

      return { room };
    } catch (error) {
      console.log('media stream producer resume', error);
      throw new WsException(error as object);
    }
  }

  private async getUserFromSocket(socket: Socket) {
    const cookie = socket.handshake.headers.cookie;
    const { Authentication: authenticationToken } = parse(cookie);
    const user =
      await this.authenticationService.getUserFromAuthenticationToken(
        authenticationToken,
      );

    if (!user) {
      throw new WsException('Неверные учетные данные.');
    }

    return user;
  }
}
