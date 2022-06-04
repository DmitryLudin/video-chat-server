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
  SendTrackDto,
} from 'src/modules/video-chat/dto';
import {
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

  getProducers(roomId: string) {
    return this.roomsMediaDataService.getProducers(roomId);
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
