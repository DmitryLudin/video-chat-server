import { DtlsParameters } from 'mediasoup/node/lib/WebRtcTransport';

export class ConnectWebRtcTransportDto {
  readonly memberId: string;
  readonly transportId: string;
  readonly dtlsParameters: DtlsParameters;
}
