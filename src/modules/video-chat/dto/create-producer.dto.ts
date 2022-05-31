import { MediaKind, RtpParameters } from 'mediasoup/node/lib/RtpParameters';

export class CreateWebRtcProducerDto {
  memberId: string;
  transportId: string;
  kind: MediaKind;
  rtpParameters: RtpParameters;
  paused = false;
}
