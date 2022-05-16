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
import { MediasoupService } from 'src/modules/mediasoup/mediasoup.service';
import { AddMessageDto } from 'src/modules/meetings/dto';
import { Message } from 'src/modules/meetings/entities';
import {
  CreateWebRtcTransportDto,
  ConnectWebRtcTransportDto,
  CreateProducerDto,
  CreateConsumerDto,
} from 'src/modules/video-chat/dto';
import {
  ICreateConsumerOptions,
  IWebrtcTransportOptions,
} from 'src/modules/video-chat/types';
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

  constructor(
    private readonly videoChatService: VideoChatService,
    private readonly mediasoupServce: MediasoupService,
  ) {
    mediasoupServce.createWorkers().then();
  }

  async handleConnection(client: Socket) {
    try {
      const { meeting, messages } = await this.videoChatService.connect(client);

      client.join(meeting.id);
      client.to(meeting.id).emit(VideoChatAction.MEMBERS, {
        meeting: this.deserializeData(meeting.members),
      });
      client.emit(VideoChatAction.JOIN_MEETING, {
        meeting: this.deserializeData(meeting),
        messages: this.deserializeData(messages),
        routerRtpCapabilities: meeting.webRtcRouter.rtpCapabilities,
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

  @UseInterceptors(ClassSerializerInterceptor)
  @SubscribeMessage(VideoChatAction.CREATE_WEBRTC_TRANSPORT)
  async handleCreateWebRtcTransport(
    @MessageBody() createWebRtcTransportData: CreateWebRtcTransportDto,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<{ transportOptions: IWebrtcTransportOptions }>> {
    const { id, iceParameters, iceCandidates, dtlsParameters } =
      await this.videoChatService.createWebRtcTransport(
        client,
        createWebRtcTransportData,
      );

    console.log('create webrtc transport', client.id);
    return {
      event: VideoChatAction.CREATE_WEBRTC_TRANSPORT,
      data: {
        transportOptions: { id, iceParameters, iceCandidates, dtlsParameters },
      },
    };
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @SubscribeMessage(VideoChatAction.CONNECT_WEBRTC_TRANSPORT)
  async handleConnectWebRtcTransport(
    @MessageBody() connectWebRtcTransportData: ConnectWebRtcTransportDto,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<{ connected: boolean }>> {
    await this.videoChatService.connectWebRtcTransport(
      client,
      connectWebRtcTransportData,
    );

    console.log('connect webrtc transport', client.id);
    return {
      event: VideoChatAction.CONNECT_WEBRTC_TRANSPORT,
      data: {
        connected: true,
      },
    };
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @SubscribeMessage(VideoChatAction.CREATE_PRODUCER)
  async handleProduce(
    @MessageBody() createProducerData: CreateProducerDto,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<{ producerId: string }>> {
    const producer = await this.videoChatService.produce(
      client,
      createProducerData,
    );

    console.log('create producer', client.id);
    return {
      event: VideoChatAction.CREATE_PRODUCER,
      data: {
        producerId: producer.id,
      },
    };
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @SubscribeMessage(VideoChatAction.CREATE_CONSUMER)
  async handleConsume(
    @MessageBody() createConsumerData: CreateConsumerDto,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<{ consumerOptions: ICreateConsumerOptions }>> {
    const consumer = await this.videoChatService.consume(
      client,
      createConsumerData,
    );

    console.log('create consumer', client.id);
    return {
      event: VideoChatAction.CREATE_CONSUMER,
      data: {
        consumerOptions: {
          producerId: consumer.producerId,
          consumerId: consumer.id,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
          type: consumer.type,
          producerPaused: consumer.producerPaused,
        },
      },
    };
  }

  private deserializeData<T extends object>(data: T): T {
    return instanceToPlain(data) as T;
  }
}
