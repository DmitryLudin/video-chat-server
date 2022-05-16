import { Type } from 'class-transformer';
import { Allow, IsBoolean } from 'class-validator';
import { Router } from 'mediasoup/node/lib/Router';

export class CreateWebrtcTransportDto {
  @Allow()
  @Type(() => Router)
  webRtcRouter: Router;

  @IsBoolean()
  isConsumeTransport?: boolean;
}
