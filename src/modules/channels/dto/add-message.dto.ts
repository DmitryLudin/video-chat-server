import { IsOptional, IsString } from 'class-validator';

export class AddMessageDto {
  @IsString()
  text: string;

  @IsOptional()
  channelId?: string;

  @IsOptional()
  userId?: string;

  @IsOptional()
  replyMessageId: string;
}
