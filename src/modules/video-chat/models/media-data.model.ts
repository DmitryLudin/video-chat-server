import { Consumer } from 'mediasoup/node/lib/Consumer';
import { Producer } from 'mediasoup/node/lib/Producer';
import { Router } from 'mediasoup/node/lib/Router';
import { WebRtcTransport } from 'mediasoup/node/lib/WebRtcTransport';
import {
  ConnectWebRtcTransportDto,
  CreateWebRtcConsumerDto,
  CreateWebRtcProducerDto,
} from 'src/modules/video-chat/dto';
import { IWebrtcTransportParams } from 'src/modules/video-chat/types';
import { webRtcConfig } from 'src/modules/webrtc/constants';

type TMemberId = string;
type TProducerId = string;
type TConsumerId = string;
type TTransportId = string;
interface IPeer {
  transports: Map<TTransportId, WebRtcTransport>;
  producers: Map<TProducerId, Producer>;
  consumers: Map<TConsumerId, Consumer>;
}

export class MediaData {
  readonly router: Router;
  private readonly peers: Map<TMemberId, IPeer>;

  constructor(router: Router) {
    this.peers = new Map();
    this.router = router;
  }

  getTransports(memberId: string) {
    const peer = this.peers.get(memberId);
    const transports: Array<IWebrtcTransportParams> = [];

    peer.transports.forEach((transport) => {
      transports.push({
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      });
    });

    return transports;
  }

  async addPeer(memberId: string) {
    const transports = await Promise.all([
      this.createTransport(),
      this.createTransport(),
    ]);

    this.peers.set(memberId, {
      transports: new Map(
        transports.map((transport) => [transport.id, transport]),
      ),
      producers: new Map(),
      consumers: new Map(),
    });
  }

  async connectPeerTransport({
    memberId,
    dtlsParameters,
    transportId,
  }: ConnectWebRtcTransportDto) {
    const peer = this.peers.get(memberId);

    return peer.transports.get(transportId).connect({ dtlsParameters });
  }

  async createPeerProducer({
    memberId,
    transportId,
    ...others
  }: CreateWebRtcProducerDto) {
    const peer = this.peers.get(memberId);
    const producer = await peer.transports.get(transportId).produce(others);

    peer.producers.set(producer.id, producer);

    producer.on('transportclose', async () => {
      await producer.close();
      peer.producers.delete(producer.id);
    });

    return producer;
  }

  async createPeerConsumer({
    memberId,
    transportId,
    ...others
  }: CreateWebRtcConsumerDto) {
    const peer = this.peers.get(memberId);
    const consumer = await peer.transports.get(transportId).consume(others);

    peer.consumers.set(consumer.id, consumer);

    consumer.on('transportclose', async () => {
      await consumer.close();
      peer.consumers.delete(consumer.id);
    });

    consumer.on('producerclose', async () => {
      await consumer.close();
      peer.consumers.delete(consumer.id);
    });

    if (consumer.type === 'simulcast') {
      await consumer.setPreferredLayers({
        spatialLayer: 2,
        temporalLayer: 2,
      });
    }

    return consumer;
  }

  private async createTransport() {
    const { maxIncomingBitrate, initialAvailableOutgoingBitrate, listenIps } =
      webRtcConfig.mediasoup.webRtcTransport;

    const transport = await this.router.createWebRtcTransport({
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
    });

    return transport;
  }
}
