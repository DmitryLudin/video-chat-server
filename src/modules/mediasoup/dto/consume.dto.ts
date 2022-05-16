import { RtpCapabilities } from 'mediasoup/node/lib/RtpParameters';

export class ConsumeDto {
  producerId: string;
  rtpCapabilities: RtpCapabilities;
  paused = true;
}
