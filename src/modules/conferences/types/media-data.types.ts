import {
  MediaKind,
  RtpCapabilities,
  RtpParameters,
} from 'mediasoup/node/lib/RtpParameters';
import { DtlsParameters } from 'mediasoup/node/lib/WebRtcTransport';

export interface ICreateMediaDataDto {
  memberId: string;
}

export interface IConnectMediaStreamDto {
  memberId: string;
  transportId: string;
  dtlsParameters: DtlsParameters;
}

export interface ICreateMediaStreamProducerDto {
  memberId: string;
  transportId: string;
  kind: MediaKind;
  rtpParameters: RtpParameters;
  paused: false;
}

export interface ICreateMediaStreamConsumerDto {
  memberId: string;
  transportId: string;
  producerId: string;
  rtpCapabilities: RtpCapabilities;
  paused: true;
}

export interface IPauseResumeMediaStreamProducerDto {
  roomId: string;
  memberId: string;
  producerId: string;
  kind: string;
}

export interface IResumeMediaStreamConsumerDto {
  memberId: string;
  consumerId: string;
}

export interface IGetMemberMediaDataDto {
  memberId: string;
  streams: Array<{ producerId: string; mediaKind: MediaKind }>;
}
