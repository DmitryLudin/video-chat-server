import { MediaKind, RtpParameters } from 'mediasoup/node/lib/RtpParameters';

export class ProduceDto {
  kind: MediaKind;
  rtpParameters: RtpParameters;
  paused = false;
}
