import { Consumer } from 'mediasoup/node/lib/Consumer';
import { Producer } from 'mediasoup/node/lib/Producer';
import { Router } from 'mediasoup/node/lib/Router';
import { WebRtcTransport } from 'mediasoup/node/lib/WebRtcTransport';

export type TMeetingId = string;
export type TMemberId = string;
export type TProducerId = string;
export type TConsumerId = string;

export interface IWebRtcMeetingData {
  router: Router;
  members: Record<TMemberId, IWebRtcMember>;
}

export interface IWebRtcMember {
  transports?: {
    produce: WebRtcTransport;
    consume: WebRtcTransport;
  };
  producers?: Map<TProducerId, Producer>;
  consumers?: Map<TConsumerId, Consumer>;
}
