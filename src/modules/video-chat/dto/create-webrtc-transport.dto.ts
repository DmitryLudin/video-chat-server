import { IsBoolean, IsString } from 'class-validator';

export class CreateWebRtcTransportDto {
  @IsString()
  memberId: string;

  @IsBoolean()
  isConsumeTransport?: boolean;
}
