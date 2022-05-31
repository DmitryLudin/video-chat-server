import { RtpCapabilities } from 'mediasoup/node/lib/RtpParameters';

export class CreateWebRtcConsumerDto {
  memberId: string;
  transportId: string;
  producerId: string;
  rtpCapabilities: RtpCapabilities;
  paused = true;
}
