import { IsString } from 'class-validator';

export class ResumeReceiveTrackDto {
  @IsString()
  memberId: string;

  @IsString()
  consumerId: string;
}
