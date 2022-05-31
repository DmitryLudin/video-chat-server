import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  ConnectWebRtcTransportDto,
  CreateWebRtcConsumerDto,
  CreateWebRtcProducerDto,
} from 'src/modules/video-chat/dto';
import { MediaData } from 'src/modules/video-chat/models';
import { WebRtcService } from 'src/modules/webrtc/webrtc.service';

type TRoomId = string;

@Injectable()
export class RoomsMediaDataService {
  private readonly _store: Map<TRoomId, MediaData>;

  constructor(private readonly webRtcService: WebRtcService) {
    this._store = new Map();
  }

  async create(roomId: string, memberId: string) {
    const router = await this.webRtcService.createRouter();
    const roomMediaData = new MediaData(router);
    await roomMediaData.addPeer(memberId);
    this._store.set(roomId, roomMediaData);
  }

  async addPeer(roomId: string, memberId: string) {
    const roomMediaData = this._store.get(roomId);
    await roomMediaData.addPeer(memberId);
  }

  async connectPeerTransport(roomId: string, data: ConnectWebRtcTransportDto) {
    const roomMediaData = this._store.get(roomId);

    return roomMediaData.connectPeerTransport(data);
  }

  async createPeerProducer(roomId: string, data: CreateWebRtcProducerDto) {
    const roomMediaData = this._store.get(roomId);

    return roomMediaData.createPeerProducer(data);
  }

  async createPeerConsumer(roomId: string, data: CreateWebRtcConsumerDto) {
    const roomMediaData = this._store.get(roomId);

    if (
      !roomMediaData.router.canConsume({
        producerId: data.producerId,
        rtpCapabilities: data.rtpCapabilities,
      })
    ) {
      throw new HttpException(
        'Невозможно получить медиа-данные',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return roomMediaData.createPeerConsumer(data);
  }

  getRouterRtpCapabilities(roomId: string) {
    const roomMediaData = this._store.get(roomId);

    return roomMediaData.router.rtpCapabilities;
  }

  getTransports(roomId: string, memberId: string) {
    const roomMediaData = this._store.get(roomId);

    return roomMediaData.getTransports(memberId);
  }
}
