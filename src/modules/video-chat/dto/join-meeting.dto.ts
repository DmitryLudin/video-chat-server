import { IsNumber, IsString } from 'class-validator';

export class JoinMeetingDto {
  @IsString()
  meetingId: string;

  @IsNumber()
  userId: number;
}
