import { Consumer } from 'mediasoup/node/lib/Consumer';
import { Producer } from 'mediasoup/node/lib/Producer';
import { Router } from 'mediasoup/node/lib/Router';
import { MediaKind } from 'mediasoup/node/lib/RtpParameters';
import { WebRtcTransport } from 'mediasoup/node/lib/WebRtcTransport';
import {
  IConnectMediaStreamDto,
  ICreateMediaStreamConsumerDto,
  ICreateMediaStreamProducerDto,
  IPauseResumeMediaStreamProducerDto,
  IResumeMediaStreamConsumerDto,
} from 'src/modules/conferences/types/media-data.types';
import { IWebrtcTransportParams } from 'src/modules/conferences/types/webrtc-transport-params.interface';
import { webRtcConfig } from 'src/modules/webrtc/constants';

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
  private readonly streams: Map<TMemberId, IMediaStream>;

  get router() {
    return this._router;
  }

  constructor(router: Router) {
    this.streams = new Map();
    this._router = router;
  }

  getTransports(memberId: string) {
    const mediaStream = this.streams.get(memberId);
    const transports: Array<IWebrtcTransportParams> = [];

    mediaStream.transports.forEach((transport) => {
      transports.push({
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      });
    });

    return transports;
  }

  getStreamTracks() {
    const tracks: Array<{
      producerId: string;
      memberId: string;
      mediaKind: MediaKind;
    }> = [];

    this.streams.forEach((stream, memberId) => {
      stream.producers.forEach((producer) => {
        tracks.push({
          producerId: producer.id,
          memberId,
          mediaKind: producer.kind,
        });
      });
    });

    return tracks;
  }

  async addStream(memberId: string) {
    const transports = await Promise.all([
      this.createTransport(),
      this.createTransport(),
    ]);

    console.log(transports[0].id);
    this.streams.set(memberId, {
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
    const stream = this.streams.get(memberId);

    return stream.transports.get(transportId).connect({ dtlsParameters });
  }

  /* Stream Producers */
  async createStreamProducer({
    memberId,
    transportId,
    ...others
  }: ICreateMediaStreamProducerDto) {
    const stream = this.streams.get(memberId);
    const producer = await stream.transports.get(transportId).produce(others);

    stream.producers.set(producer.id, producer);

    producer.on('transportclose', async () => {
      await producer.close();
      this.streams.get(memberId)?.transports?.delete(transportId);
      stream.producers.delete(producer.id);
    });

    console.log(producer);
    return producer;
  }

  async pauseStreamProducer({
    memberId,
    producerId,
  }: IPauseResumeMediaStreamProducerDto) {
    const stream = this.streams.get(memberId);
    const trackProducer = stream.producers.get(producerId);
    return trackProducer.pause();
  }

  async resumeStreamProducer({
    memberId,
    producerId,
  }: IPauseResumeMediaStreamProducerDto) {
    const stream = this.streams.get(memberId);
    const trackProducer = stream.producers.get(producerId);
    return trackProducer.resume();
  }

  /* Stream Consumers */
  async createStreamConsumer({
    memberId,
    transportId,
    ...others
  }: ICreateMediaStreamConsumerDto) {
    const stream = this.streams.get(memberId);
    const consumer = await stream.transports.get(transportId).consume(others);

    stream.consumers.set(consumer.id, consumer);

    consumer.on('transportclose', async () => {
      console.log('createStreamConsumer: transport close');
      await consumer.close();
      this.streams.get(memberId)?.transports?.delete(transportId);
      stream.consumers.delete(consumer.id);
    });

    consumer.on('producerclose', async () => {
      console.log('createStreamConsumer: producer close');
      await consumer.close();
      stream.producers.delete(others.producerId);
      stream.consumers.delete(consumer.id);
    });

    // if (consumer.type === 'simulcast') {
    //   await consumer.setPreferredLayers({
    //     spatialLayer: 2,
    //     temporalLayer: 2,
    //   });
    // }

    return consumer;
  }

  async resumeStreamConsumer({
    memberId,
    consumerId,
  }: IResumeMediaStreamConsumerDto) {
    const stream = this.streams.get(memberId);
    const trackConsumer = stream.consumers.get(consumerId);
    return trackConsumer.resume();
  }

  /* Close Streams */
  closeAllStreams() {
    this._router.close();
    this.streams.forEach((stream, memberId: string) => {
      this.closeStream(memberId);
    });
  }

  closeStream(memberId: string) {
    const stream = this.streams.get(memberId);

    stream.transports.forEach((transport) => {
      // our producer and consumer event handlers will take care of
      // calling closeProducer() and closeConsumer() on all the producers
      // and consumers associated with this transport
      transport.close();
      stream.transports.delete(transport.id);
    });

    this.streams.delete(memberId);
  }

  private async createTransport() {
    const { maxIncomingBitrate, initialAvailableOutgoingBitrate, listenIps } =
      webRtcConfig.mediasoup.webRtcTransport;

    const transport = await this._router.createWebRtcTransport({
      listenIps,
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
