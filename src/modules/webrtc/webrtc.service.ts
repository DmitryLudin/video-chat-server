import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RouterOptions } from 'mediasoup/node/lib/Router';
import * as mediasoup from 'mediasoup';
import { Worker, WorkerSettings } from 'mediasoup/node/lib/Worker';
import { config } from 'src/constants/config';

@Injectable()
export class WebRtcService {
  private workers: Worker[] = [];
  private nextWorkerIndex = 0;

  constructor(private readonly configService: ConfigService) {
    this.createWorkers()
      .then(() => console.log('workers created'))
      .catch((error) => console.log(error));
  }

  async createRouter() {
    const worker = this.getMediasoupWorker();
    const mediaCodecs = config.mediasoup.router.mediaCodecs;

    return await worker.createRouter({ mediaCodecs } as RouterOptions);
  }

  private async createWorkers() {
    const { numWorkers, worker } = config.mediasoup;

    for (let i = 0; i < numWorkers; i++) {
      const mediaSoupWorker = await mediasoup.createWorker({
        logLevel: worker.logLevel,
        logTags: worker.logTags,
        rtcMinPort: this.configService.get('WEBRTC_MIN_PORT'),
        rtcMaxPort: this.configService.get('WEBRTC_MAX_PORT'),
      } as WorkerSettings);

      mediaSoupWorker.on('died', () => {
        console.error(
          'mediasoup worker died, exiting in 2 seconds... [pid:%d]',
          mediaSoupWorker.pid,
        );
      });

      this.workers.push(mediaSoupWorker);
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
