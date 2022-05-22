import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { parse } from 'cookie';
import { Socket } from 'socket.io';
import { AuthenticationService } from 'src/modules/authentication/authentication.service';
import {
  AddMessageDto,
  CreateMeetingDto,
  CreateMemberDto,
} from 'src/modules/meetings/dto';
import { MeetingsService } from 'src/modules/meetings/meetings.service';
import {
  ConnectWebRtcTransportDto,
  CreateConsumerDto,
  CreateWebRtcProducerDto,
} from 'src/modules/video-chat/dto';
import {
  IWebRtcMeetingData,
  TMeetingId,
  TProducerId,
} from 'src/modules/video-chat/types';
import { WebRtcService } from 'src/modules/webrtc/webrtc.service';

@Injectable()
export class VideoChatService {
  private _videoChatStore = new Map<TMeetingId, IWebRtcMeetingData>();

  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly meetingsService: MeetingsService,
    private readonly webRtcService: WebRtcService,
  ) {}

  // Методы для VideoChatController
  async createMeeting(data: CreateMeetingDto) {
    const meeting = await this.meetingsService.create(data);
    const router = await this.webRtcService.createRouter();
    const member = meeting.members[0];
    this._videoChatStore.set(meeting.id, {
      router,
      members: {
        [member.id]: {
          transports: {
            produce: await this.webRtcService.createWebRtcTransport(router),
            consume: await this.webRtcService.createWebRtcTransport(router),
          },
          producers: new Map(),
          consumers: new Map(),
        },
      },
    });

    return meeting;
  }

  async getMeeting(meetingId: string) {
    return this.meetingsService.getById(meetingId);
  }

  async checkUserJoinedMeeting(meetingId: string, userId: number) {
    return this.meetingsService.getByIdAndUserId(meetingId, userId);
  }

  async joinMeeting(meetingId: string, data: CreateMemberDto) {
    const meeting = await this.meetingsService.addMember(meetingId, data);
    const member = meeting.members.find(
      (member) => member.user.id === data.userId,
    );

    const meetingState = this._videoChatStore.get(meeting.id);
    meetingState.members[member.id] = {
      transports: {
        produce: await this.webRtcService.createWebRtcTransport(
          meetingState.router,
        ),
        consume: await this.webRtcService.createWebRtcTransport(
          meetingState.router,
        ),
      },
      producers: new Map(),
      consumers: new Map(),
    };

    return meeting;
  }

  async leaveMeeting(meetingId: string, userId: number) {
    return this.meetingsService.deleteMember(meetingId, userId);
  }

  async endMeeting(meetingId: string) {
    return this.meetingsService.endMeeting(meetingId);
  }

  async connectWebRtcTransport(
    meetingId: string,
    data: ConnectWebRtcTransportDto,
  ) {
    const meetingState = this._videoChatStore.get(meetingId);
    const memberState = meetingState.members[data.memberId];

    if (data.isConsumeTransport) {
      return memberState.transports.consume.connect({
        dtlsParameters: data.dtlsParameters,
      });
    }

    return memberState.transports.produce.connect({
      dtlsParameters: data.dtlsParameters,
    });
  }

  async createWebRtcProducer(meetingId: string, data: CreateWebRtcProducerDto) {
    const meetingState = this._videoChatStore.get(meetingId);
    const memberState = meetingState.members[data.memberId];
    const producer = await this.webRtcService.createProducer(
      memberState.transports.produce,
      data,
    );

    memberState.producers.set(producer.id, producer);

    return producer;
  }

  async createWebRtcConsumer(meetingId: string, data: CreateConsumerDto) {
    const meetingState = this._videoChatStore.get(meetingId);
    const memberState = meetingState.members[data.memberId];

    if (
      !meetingState.router.canConsume({
        producerId: data.producerId,
        rtpCapabilities: data.rtpCapabilities,
      })
    ) {
      throw new HttpException(
        'Невозможно получить медиа-данные',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const consumer = await this.webRtcService.createConsumer(
      memberState.transports.consume,
      data,
    );

    memberState.consumers.set(consumer.id, consumer);

    return consumer;
  }

  // Методы для VideoChatGateway
  async connect(client: Socket) {
    try {
      const user = await this.getUserFromSocket(client);
      const meeting = await this.meetingsService.getByUserId(user.id);
      const messages = await this.meetingsService.getAllMessages(meeting.id);
      const meetingState = this._videoChatStore.get(meeting.id);
      const member = meeting.members.find(
        (member) => member.user.id === user.id,
      );
      const { transports } = meetingState.members[member.id];

      console.log('connect', client.id);
      return {
        meeting,
        messages,
        webRtcRouter: meetingState.router,
        transportProduceData: {
          id: transports.produce.id,
          iceParameters: transports.produce.iceParameters,
          iceCandidates: transports.produce.iceCandidates,
          dtlsParameters: transports.produce.dtlsParameters,
        },
        transportConsumeData: {
          id: transports.consume.id,
          iceParameters: transports.consume.iceParameters,
          iceCandidates: transports.consume.iceCandidates,
          dtlsParameters: transports.consume.dtlsParameters,
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
      const meeting = await this.meetingsService.getByUserId(user.id);
      console.log('disconnect', client.id);

      if (meeting.ownerId === user.id) {
        await this.meetingsService.endMeeting(meeting.id);
        return { isMeetingOver: true, meeting };
      }

      const updatedMeeting = await this.meetingsService.deleteMember(
        meeting.id,
        user.id,
      );
      return { meeting: updatedMeeting };
    } catch (error) {
      console.log('disconnect', error);
      throw new WsException(error as object);
    }
  }

  async addMessage(client: Socket, addMessageData: AddMessageDto) {
    try {
      return await this.meetingsService.addMessage(addMessageData);
    } catch (error) {
      console.log('add message', error);
      throw new WsException(error as object);
    }
  }

  getProducers(meetingId: string) {
    const { members } = this._videoChatStore.get(meetingId);
    const producerIds: Array<{ id: TProducerId }> = [];

    for (const memberId in members) {
      const member = members[memberId];

      member.producers.forEach((producer) => {
        producerIds.push({ id: producer.id });
      });
    }

    return producerIds;
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
