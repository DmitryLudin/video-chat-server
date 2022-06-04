import { DtlsParameters } from 'mediasoup/node/lib/WebRtcTransport';

export class ConnectMediaStreamDto {
  readonly memberId: string;
  readonly transportId: string;
  readonly dtlsParameters: DtlsParameters;
}
