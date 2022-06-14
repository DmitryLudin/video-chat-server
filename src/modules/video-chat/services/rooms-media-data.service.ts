import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  ConnectMediaStreamDto,
  ReceiveTrackDto,
  ResumeReceiveTrackDto,
  SendTrackDto,
  SendTrackPauseResumeDto,
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

  delete(roomId: string) {
    const roomMediaData = this._store.get(roomId);
    roomMediaData.close();
    this._store.delete(roomId);
  }

  deletePeer(roomId: string, memberId: string) {
    const roomMediaData = this._store.get(roomId);
    roomMediaData.closePeer(memberId);
  }

  async addPeer(roomId: string, memberId: string) {
    const roomMediaData = this._store.get(roomId);
    await roomMediaData.addPeer(memberId);
  }

  async connectPeerTransport(roomId: string, data: ConnectMediaStreamDto) {
    const roomMediaData = this._store.get(roomId);

    return roomMediaData.connectPeerTransport(data);
  }

  async createSendingStreamTrack(roomId: string, track: SendTrackDto) {
    const roomMediaData = this._store.get(roomId);
    const trackData = await roomMediaData.createPeerTrackProducer(track);

    return { producerId: trackData.id };
  }

  async createReceivingStreamTrack(roomId: string, data: ReceiveTrackDto) {
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

    const { id, kind, rtpParameters, type, producerId, producerPaused } =
      await roomMediaData.createPeerTrackConsumer(data);

    return { id, kind, rtpParameters, type, producerId, producerPaused };
  }

  async resumeMemberReceiveTrack(roomId: string, data: ResumeReceiveTrackDto) {
    const roomMediaData = this._store.get(roomId);

    return roomMediaData.resumePeerReceiveTrack(data);
  }

  async pauseMemberSendTrack(data: SendTrackPauseResumeDto) {
    const roomMediaData = this._store.get(data.roomId);

    return roomMediaData.pausePeerSendTrack(data);
  }

  async resumeMemberSendTrack(data: SendTrackPauseResumeDto) {
    const roomMediaData = this._store.get(data.roomId);

    return roomMediaData.resumePeerSendTrack(data);
  }

  getRoomRouterRtpCapabilities(roomId: string) {
    const roomMediaData = this._store.get(roomId);

    return roomMediaData.router.rtpCapabilities;
  }

  getMemberTransports(roomId: string, memberId: string) {
    const roomMediaData = this._store.get(roomId);

    return roomMediaData.getTransports(memberId);
  }

  getPeerTracks(roomId: string) {
    const roomMediaData = this._store.get(roomId);

    return roomMediaData.getPeerTracks();
  }
}
