import { ConsumerType } from 'mediasoup/node/lib/Consumer';
import { MediaKind, RtpParameters } from 'mediasoup/node/lib/RtpParameters';

export interface ICreateConsumerOptions {
  producerId: string;
  consumerId: string;
  kind: MediaKind;
  rtpParameters: RtpParameters;
  type: ConsumerType;
  producerPaused: boolean;
}
