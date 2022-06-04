import { RtpCapabilities } from 'mediasoup/node/lib/RtpParameters';

export class ReceiveTrackDto {
  memberId: string;
  transportId: string;
  producerId: string;
  rtpCapabilities: RtpCapabilities;
  paused = true;
}
