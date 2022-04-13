import { IsString } from 'class-validator';

export class JoinMeetingDto {
  @IsString()
  meetingId: string;
}
