import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AddMessageDto {
  @IsString()
  @MaxLength(250)
  text: string;

  @IsString()
  meetingId: string;

  @IsString()
  memberId: string;

  @IsOptional()
  replyMessageId?: string;
}
