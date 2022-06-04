import { Injectable } from '@nestjs/common';
import { RouterOptions } from 'mediasoup/node/lib/Router';
import * as mediasoup from 'mediasoup';
import { Worker, WorkerSettings } from 'mediasoup/node/lib/Worker';
import { webRtcConfig } from 'src/modules/webrtc/constants';

@Injectable()
export class WebRtcService {
  private workers: Worker[] = [];
  private nextWorkerIndex = 0;

  constructor() {
    this.createWorkers()
      .then(() => console.log('workers created'))
      .catch((error) => console.log(error));
  }

  async createRouter() {
    const worker = this.getMediasoupWorker();
    const mediaCodecs = webRtcConfig.mediasoup.router.mediaCodecs;

    return await worker.createRouter({ mediaCodecs } as RouterOptions);
  }

  private async createWorkers() {
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

  private getMediasoupWorker() {
    const worker = this.workers[this.nextWorkerIndex];

    if (++this.nextWorkerIndex === this.workers.length) {
      this.nextWorkerIndex = 0;
    }

    return worker;
  }
}
