import { Consumer } from 'mediasoup/node/lib/Consumer';
import { Producer } from 'mediasoup/node/lib/Producer';
import { Router } from 'mediasoup/node/lib/Router';
import { MediaKind } from 'mediasoup/node/lib/RtpParameters';
import {
  WebRtcTransport,
  WebRtcTransportOptions,
} from 'mediasoup/node/lib/WebRtcTransport';
import { config } from 'src/constants/config';
import {
  IConnectMediaStreamDto,
  ICreateMediaStreamConsumerDto,
  ICreateMediaStreamProducerDto,
  IGetMemberMediaDataDto,
  IPauseResumeMediaStreamProducerDto,
  IResumeMediaStreamConsumerDto,
} from 'src/modules/conferences/types/media-data.types';
import { IWebrtcTransportParams } from 'src/modules/conferences/types/webrtc-transport-params.interface';

type TMemberId = string;
type TProducerId = string;
type TConsumerId = string;
type TTransportId = string;
interface IMediaStream {
  transports: Map<TTransportId, WebRtcTransport>;
  producers: Map<TProducerId, Producer>;
  consumers: Map<TConsumerId, Consumer>;
}

export class MediaData {
  private readonly _router: Router;
  private readonly store: Map<TMemberId, IMediaStream>;

  get router() {
    return this._router;
  }

  constructor(router: Router) {
    this.store = new Map();
    this._router = router;
  }

  getTransports(memberId: string) {
    const mediaData = this.store.get(memberId);
    const transports: Array<IWebrtcTransportParams> = [];

    mediaData.transports.forEach((transport) => {
      transports.push({
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      });
    });

    return transports;
  }

  getMemberMediaData() {
    const mediaData: Array<IGetMemberMediaDataDto> = [];

    this.store.forEach((memberMediaData, memberId) => {
      const streams: Array<{
        producerId: string;
        isPaused: boolean;
        mediaKind: MediaKind;
      }> = [];

      memberMediaData.producers.forEach((producer) => {
        streams.push({
          producerId: producer.id,
          isPaused: producer.paused,
          mediaKind: producer.kind,
        });
      });

      mediaData.push({
        memberId,
        streams,
      });
    });

    return mediaData;
  }

  async addStream(memberId: string, transportOptions: WebRtcTransportOptions) {
    const transports = await Promise.all([
      this.createTransport(transportOptions),
      this.createTransport(transportOptions),
    ]);

    this.store.set(memberId, {
      transports: new Map(
        transports.map((transport) => [transport.id, transport]),
      ),
      producers: new Map(),
      consumers: new Map(),
    });
  }

  async connectStreamTransport({
    memberId,
    dtlsParameters,
    transportId,
  }: IConnectMediaStreamDto) {
    const mediaData = this.store.get(memberId);

    return mediaData.transports.get(transportId).connect({ dtlsParameters });
  }

  /* Stream Producers */
  async createStreamProducer({
    memberId,
    transportId,
    ...others
  }: ICreateMediaStreamProducerDto) {
    const mediaData = this.store.get(memberId);
    const producer = await mediaData.transports
      .get(transportId)
      .produce(others);

    mediaData.producers.set(producer.id, producer);

    producer.on('transportclose', async () => {
      await producer.close();
      this.store.get(memberId)?.transports?.delete(transportId);
      mediaData.producers.delete(producer.id);
    });

    return producer;
  }

  async pauseStreamProducer({
    memberId,
    producerId,
  }: IPauseResumeMediaStreamProducerDto) {
    const mediaData = this.store.get(memberId);
    const trackProducer = mediaData.producers.get(producerId);
    return trackProducer.pause();
  }

  async resumeStreamProducer({
    memberId,
    producerId,
  }: IPauseResumeMediaStreamProducerDto) {
    const mediaData = this.store.get(memberId);
    const trackProducer = mediaData.producers.get(producerId);
    return trackProducer.resume();
  }

  /* Stream Consumers */
  async createStreamConsumer({
    memberId,
    transportId,
    ...others
  }: ICreateMediaStreamConsumerDto) {
    const mediaData = this.store.get(memberId);
    const consumer = await mediaData.transports
      .get(transportId)
      .consume(others);

    mediaData.consumers.set(consumer.id, consumer);

    consumer.on('transportclose', async () => {
      console.log('createStreamConsumer: transport close');
      await consumer.close();
      this.store.get(memberId)?.transports?.delete(transportId);
      mediaData.consumers.delete(consumer.id);
    });

    consumer.on('producerclose', async () => {
      console.log('createStreamConsumer: producer close');
      await consumer.close();
      mediaData.producers.delete(others.producerId);
      mediaData.consumers.delete(consumer.id);
    });

    consumer.on('producerpause', async () => {
      console.log('createStreamConsumer: producer pause');
      await consumer.pause();
    });

    consumer.on('producerresume', async () => {
      console.log('createStreamConsumer: producer resume');
      await consumer.resume();
    });

    if (consumer.type === 'simulcast') {
      await consumer.setPreferredLayers({
        spatialLayer: 2,
        temporalLayer: 2,
      });
    }

    return consumer;
  }

  async resumeStreamConsumer({
    memberId,
    consumerId,
  }: IResumeMediaStreamConsumerDto) {
    const mediaData = this.store.get(memberId);
    const trackConsumer = mediaData.consumers.get(consumerId);
    return trackConsumer.resume();
  }

  /* Close Streams */
  closeAllStreams() {
    this._router.close();
    this.store.forEach((stream, memberId: string) => {
      this.closeStream(memberId);
    });
  }

  closeStream(memberId: string) {
    const mediaData = this.store.get(memberId);

    mediaData.transports.forEach((transport) => {
      // our producer and consumer event handlers will take care of
      // calling closeProducer() and closeConsumer() on all the producers
      // and consumers associated with this transport
      transport.close();
      mediaData.transports.delete(transport.id);
    });

    this.store.delete(memberId);
  }

  private async createTransport(options: WebRtcTransportOptions) {
    const { maxIncomingBitrate, initialAvailableOutgoingBitrate } =
      config.mediasoup.webRtcTransport;

    const transport = await this._router.createWebRtcTransport({
      ...options,
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate,
    });

    if (maxIncomingBitrate) {
      try {
        await transport.setMaxIncomingBitrate(maxIncomingBitrate);
      } catch {}
    }

    transport.on('dtlsstatechange', (dtlsState) => {
      if (dtlsState === 'closed') {
        transport.close();
      }
    });

    transport.on('routerclose', () => {
      console.log('Transport close');
      transport.close();
    });

    return transport;
  }
}
