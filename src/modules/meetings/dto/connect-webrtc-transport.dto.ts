import { DtlsParameters } from 'mediasoup/node/lib/WebRtcTransport';

export class ConnectWebRtcTransportDto {
  readonly dtlsParameters: DtlsParameters;
  readonly isConsumeTransport?: boolean;
}
