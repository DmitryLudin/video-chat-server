import { IsString } from 'class-validator';

export class SendTrackPauseResumeDto {
  @IsString()
  roomId: string;

  @IsString()
  memberId: string;

  @IsString()
  producerId: string;

  @IsString()
  kind: string;
}
