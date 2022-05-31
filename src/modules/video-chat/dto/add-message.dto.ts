import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AddMessageDto {
  @IsString()
  @MaxLength(250)
  text: string;

  @IsString()
  roomId: string;

  @IsString()
  memberId: string;

  @IsOptional()
  replyMessageId?: string;
}
