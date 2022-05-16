import { Injectable } from '@nestjs/common';
import { Router, RouterOptions } from 'mediasoup/node/lib/Router';
import * as mediasoup from 'mediasoup';
import { WebRtcTransport } from 'mediasoup/node/lib/WebRtcTransport';
import { Worker, WorkerSettings } from 'mediasoup/node/lib/Worker';
import { videoChatConfig } from 'src/constants/video-chat-config';
import { ConsumeDto, ProduceDto } from 'src/modules/mediasoup/dto';

@Injectable()
export class MediasoupService {
  workers: Worker[] = [];
  nextWorkerIndex = 0;

  async createWorkers() {
    const { numWorkers } = videoChatConfig.mediasoup;

    for (let i = 0; i < numWorkers; i++) {
      const worker = await mediasoup.createWorker({
        logLevel: videoChatConfig.mediasoup.worker.logLevel,
        logTags: videoChatConfig.mediasoup.worker.logTags,
        rtcMinPort: videoChatConfig.mediasoup.worker.rtcMinPort,
        rtcMaxPort: videoChatConfig.mediasoup.worker.rtcMaxPort,
      } as WorkerSettings);

      worker.on('died', () => {
        console.error(
          'mediasoup worker died, exiting in 2 seconds... [pid:%d]',
          worker.pid,
        );
      });

      this.workers.push(worker);
    }
  }

  async createRouter() {
    const worker = this.getMediasoupWorker();
    const mediaCodecs = videoChatConfig.mediasoup.router.mediaCodecs;

    return worker
      .createRouter({ mediaCodecs } as RouterOptions)
      .then((router) => router);
  }

  async createWebRtcTransport(router: Router) {
    const { maxIncomingBitrate, initialAvailableOutgoingBitrate, listenIps } =
      videoChatConfig.mediasoup.webRtcTransport;

    const transport = await router.createWebRtcTransport({
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

  async createProducer(transport: WebRtcTransport, produceData: ProduceDto) {
    const producer = await transport.produce(produceData);

    producer.on('transportclose', async () => {
      await producer.close();
    });

    return producer;
  }

  async createConsumer(transport: WebRtcTransport, consumeData: ConsumeDto) {
    const consumer = await transport.consume(consumeData);

    consumer.on('transportclose', async () => {
      await consumer.close();
    });

    consumer.on('producerclose', async () => {
      await consumer.close();
    });

    if (consumer.type === 'simulcast') {
      await consumer.setPreferredLayers({
        spatialLayer: 2,
        temporalLayer: 2,
      });
    }

    return consumer;
  }

  private getMediasoupWorker() {
    const worker = this.workers[this.nextWorkerIndex];

    if (++this.nextWorkerIndex === this.workers.length) {
      this.nextWorkerIndex = 0;
    }

    return worker;
  }
}
