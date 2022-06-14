import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { parse } from 'cookie';
import { Socket } from 'socket.io';
import { AuthenticationService } from 'src/modules/authentication/authentication.service';
import {
  AddMessageDto,
  ConnectMediaStreamDto,
  CreateMemberDto,
  CreateRoomDto,
  ReceiveTrackDto,
  ResumeReceiveTrackDto,
  SendTrackDto,
  SendTrackPauseResumeDto,
} from 'src/modules/video-chat/dto';
import {
  MembersService,
  MessagesService,
  RoomsMediaDataService,
  RoomsService,
} from 'src/modules/video-chat/services';

@Injectable()
export class VideoChatService {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly roomsService: RoomsService,
    private readonly roomsMediaDataService: RoomsMediaDataService,
    private readonly messagesService: MessagesService,
    private readonly membersService: MembersService,
  ) {}

  // Методы для контроллера
  async getRoomByIdAndUserId(roomId: string, userId: number) {
    return this.roomsService.getByIdAndUserId(roomId, userId);
  }

  async createRoom(data: CreateRoomDto) {
    const room = await this.roomsService.create(data);
    const member = room.members[0];

    await this.roomsMediaDataService.create(room.id, member.id);

    return room;
  }

  async joinRoom(roomId: string, data: CreateMemberDto) {
    const room = await this.roomsService.addMember(roomId, data);
    const member = room.members.find(
      (member) => member.user.id === data.userId,
    );

    await this.roomsMediaDataService.addPeer(roomId, member.id);

    return room;
  }

  async connectMediaStream(roomId: string, data: ConnectMediaStreamDto) {
    return this.roomsMediaDataService.connectPeerTransport(roomId, data);
  }

  async sendTrack(roomId: string, data: SendTrackDto) {
    return this.roomsMediaDataService.createSendingStreamTrack(roomId, data);
  }

  async receiveTrack(roomId: string, data: ReceiveTrackDto) {
    return this.roomsMediaDataService.createReceivingStreamTrack(roomId, data);
  }

  async resumeReceiveTrack(roomId: string, data: ResumeReceiveTrackDto) {
    return this.roomsMediaDataService.resumeMemberReceiveTrack(roomId, data);
  }

  // Методы для транспорта сокетов
  async connect(client: Socket) {
    try {
      const user = await this.getUserFromSocket(client);
      const room = await this.roomsService.getByUserId(user.id);
      const messages = await this.messagesService.getAllByRoomId(room.id);
      const member = room.members.find((member) => member.user.id === user.id);

      console.log('connect', client.id);
      return {
        room,
        messages,
        mediaData: {
          routerRtpCapabilities:
            this.roomsMediaDataService.getRoomRouterRtpCapabilities(room.id),
          transports: this.roomsMediaDataService.getMemberTransports(
            room.id,
            member.id,
          ),
        },
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
        this.roomsMediaDataService.delete(room.id);
        return { isRoomClosed: true, room };
      }

      const updatedRoom = await this.roomsService.deleteMember(
        room.id,
        user.id,
      );
      this.roomsMediaDataService.deletePeer(room.id, member.id);
      return { room: updatedRoom };
    } catch (error) {
      console.log('disconnect', error);
      throw new WsException(error as object);
    }
  }

  async addMessage(client: Socket, addMessageData: AddMessageDto) {
    try {
      await this.messagesService.addMessage(addMessageData);

      return this.messagesService.getAllByRoomId(addMessageData.roomId);
    } catch (error) {
      console.log('add message', error);
      throw new WsException(error as object);
    }
  }

  async sendTrackPause(data: SendTrackPauseResumeDto) {
    try {
      await (data.kind === 'audio'
        ? this.membersService.disableAudio(data.memberId)
        : this.membersService.disableVideo(data.memberId));

      const room = await this.roomsService.getById(data.roomId);

      await this.roomsMediaDataService.pauseMemberSendTrack(data);

      return { room };
    } catch (error) {
      console.log('send track pause', error);
      throw new WsException(error as object);
    }
  }

  async sendTrackResume(data: SendTrackPauseResumeDto) {
    try {
      await (data.kind === 'audio'
        ? this.membersService.enableAudio(data.memberId)
        : this.membersService.enableVideo(data.memberId));

      const room = await this.roomsService.getById(data.roomId);

      await this.roomsMediaDataService.resumeMemberSendTrack(data);

      return { room };
    } catch (error) {
      console.log('send track pause', error);
      throw new WsException(error as object);
    }
  }

  getMemberTracks(roomId: string) {
    return this.roomsMediaDataService.getPeerTracks(roomId);
  }

  // Приватные методы
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
