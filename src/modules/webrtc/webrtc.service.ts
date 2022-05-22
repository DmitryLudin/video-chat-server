import { Injectable } from '@nestjs/common';
import { Router, RouterOptions } from 'mediasoup/node/lib/Router';
import * as mediasoup from 'mediasoup';
import { WebRtcTransport } from 'mediasoup/node/lib/WebRtcTransport';
import { Worker, WorkerSettings } from 'mediasoup/node/lib/Worker';
import { webRtcConfig } from 'src/modules/webrtc/constants';
import { ConsumeDto, ProduceDto } from 'src/modules/webrtc/dto';

@Injectable()
export class WebRtcService {
  workers: Worker[] = [];
  nextWorkerIndex = 0;

  async createWorkers() {
    const { numWorkers } = webRtcConfig.mediasoup;

    for (let i = 0; i < numWorkers; i++) {
      const worker = await mediasoup.createWorker({
        logLevel: webRtcConfig.mediasoup.worker.logLevel,
        logTags: webRtcConfig.mediasoup.worker.logTags,
        rtcMinPort: webRtcConfig.mediasoup.worker.rtcMinPort,
        rtcMaxPort: webRtcConfig.mediasoup.worker.rtcMaxPort,
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
    const mediaCodecs = webRtcConfig.mediasoup.router.mediaCodecs;

    return await worker
      .createRouter({ mediaCodecs } as RouterOptions)
      .then((router) => router);
  }

  async createWebRtcTransport(router: Router) {
    const { maxIncomingBitrate, initialAvailableOutgoingBitrate, listenIps } =
      webRtcConfig.mediasoup.webRtcTransport;

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
