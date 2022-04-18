import { IsNumber, IsString } from 'class-validator';

export class LeaveMeetingDto {
  @IsString()
  meetingId: string;

  @IsNumber()
  memberId: number;
}
