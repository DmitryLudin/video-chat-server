import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { MediaData } from 'src/modules/conferences/modules/media-data/media-data.model';
import {
  IConnectMediaStreamDto,
  ICreateMediaStreamConsumerDto,
  ICreateMediaDataDto,
  ICreateMediaStreamProducerDto,
  IPauseResumeMediaStreamProducerDto,
  IResumeMediaStreamConsumerDto,
} from 'src/modules/conferences/types/media-data.types';

import { WebRtcService } from 'src/modules/webrtc/webrtc.service';

type TRoomId = string;

@Injectable()
export class MediaDataService {
  private readonly _store: Map<TRoomId, MediaData>;

  constructor(private readonly webRtcService: WebRtcService) {
    this._store = new Map();
  }

  getRoomRouterRtpCapabilities(roomId: string) {
    const mediaData = this._store.get(roomId);

    return mediaData.router.rtpCapabilities;
  }

  getMediaStreamTransports(roomId: string, memberId: string) {
    const mediaData = this._store.get(roomId);

    return mediaData.getTransports(memberId);
  }

  getMediaStreamTracks(roomId: string) {
    const mediaData = this._store.get(roomId);

    return mediaData.getStreamTracks();
  }

  async create(roomId: string, { memberId }: ICreateMediaDataDto) {
    const router = await this.webRtcService.createRouter();
    const mediaData = new MediaData(router);
    await mediaData.addStream(memberId);
    this._store.set(roomId, mediaData);
    console.log('Создали медиа данные');
  }

  async addMediaStream(roomId: string, { memberId }: ICreateMediaDataDto) {
    const mediaData = this._store.get(roomId);
    await mediaData.addStream(memberId);
  }

  async connectMediaStream(roomId: string, data: IConnectMediaStreamDto) {
    const mediaData = this._store.get(roomId);

    console.log('Подключились к транспорту медиа данных');
    return mediaData.connectStreamTransport(data);
  }

  async createMediaStreamProducer(
    roomId: string,
    data: ICreateMediaStreamProducerDto,
  ) {
    const mediaData = this._store.get(roomId);
    const producer = await mediaData.createStreamProducer(data);

    console.log('Создали продюсера');
    return { producerId: producer.id };
  }

  async pauseMediaStreamProducer(data: IPauseResumeMediaStreamProducerDto) {
    const mediaData = this._store.get(data.roomId);

    return mediaData.pauseStreamProducer(data);
  }

  async resumeMediaStreamProducer(data: IPauseResumeMediaStreamProducerDto) {
    const mediaData = this._store.get(data.roomId);

    return mediaData.resumeStreamProducer(data);
  }

  async createMediaStreamConsumer(
    roomId: string,
    data: ICreateMediaStreamConsumerDto,
  ) {
    const mediaData = this._store.get(roomId);

    if (
      !mediaData.router.canConsume({
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
      await mediaData.createStreamConsumer(data);

    return { id, kind, rtpParameters, type, producerId, producerPaused };
  }

  async resumeMediaStreamConsumer(
    roomId: string,
    data: IResumeMediaStreamConsumerDto,
  ) {
    const mediaData = this._store.get(roomId);

    return mediaData.resumeStreamConsumer(data);
  }

  delete(roomId: string) {
    const mediaData = this._store.get(roomId);
    mediaData.closeAllStreams();
    this._store.delete(roomId);
  }

  deleteMediaStream(roomId: string, memberId: string) {
    const mediaData = this._store.get(roomId);
    mediaData.closeStream(memberId);
  }
}
