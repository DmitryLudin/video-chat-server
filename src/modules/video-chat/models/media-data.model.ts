import { Consumer } from 'mediasoup/node/lib/Consumer';
import { Producer } from 'mediasoup/node/lib/Producer';
import { Router } from 'mediasoup/node/lib/Router';
import { WebRtcTransport } from 'mediasoup/node/lib/WebRtcTransport';
import {
  ConnectMediaStreamDto,
  ReceiveTrackDto,
  SendTrackDto,
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
  private readonly _router: Router;
  private readonly peers: Map<TMemberId, IPeer>;

  get router() {
    return this._router;
  }

  constructor(router: Router) {
    this.peers = new Map();
    this._router = router;
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

  getProducers() {
    const producers: Array<{ id: string }> = [];

    this.peers.forEach((peer) => {
      peer.producers.forEach((producer) => {
        producers.push({ id: producer.id });
      });
    });

    return producers;
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
  }: ConnectMediaStreamDto) {
    const peer = this.peers.get(memberId);

    return peer.transports.get(transportId).connect({ dtlsParameters });
  }

  async createPeerTrackProducer({
    memberId,
    transportId,
    ...others
  }: SendTrackDto) {
    const peer = this.peers.get(memberId);
    const producer = await peer.transports.get(transportId).produce(others);

    peer.producers.set(producer.id, producer);

    producer.on('transportclose', async () => {
      await producer.close();
      this.peers.get(memberId).transports.delete(transportId);
      peer.producers.delete(producer.id);
    });

    return producer;
  }

  async createPeerTrackConsumer({
    memberId,
    transportId,
    ...others
  }: ReceiveTrackDto) {
    const peer = this.peers.get(memberId);
    const consumer = await peer.transports.get(transportId).consume(others);

    peer.consumers.set(consumer.id, consumer);

    consumer.on('transportclose', async () => {
      console.log('createPeerConsumer: transport close');
      await consumer.close();
      this.peers.get(memberId).transports.delete(transportId);
      peer.consumers.delete(consumer.id);
    });

    consumer.on('producerclose', async () => {
      console.log('createPeerConsumer: producer close');
      await consumer.close();
      peer.producers.delete(others.producerId);
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

  close() {
    this._router.close();
    this.peers.forEach((peer, memberId: string) => {
      this.closePeer(memberId);
    });
  }

  closePeer(memberId: string) {
    const peer = this.peers.get(memberId);

    peer.transports.forEach((transport) => {
      // our producer and consumer event handlers will take care of
      // calling closeProducer() and closeConsumer() on all the producers
      // and consumers associated with this transport
      transport.close();
      peer.transports.delete(transport.id);
    });

    this.peers.delete(memberId);
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
