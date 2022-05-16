import { DtlsParameters } from 'mediasoup/node/lib/WebRtcTransport';

export class ConnectWebRtcTransportDto {
  readonly memberId: string;
  readonly dtlsParameters: DtlsParameters;
  readonly isConsumeTransport?: boolean;
}
