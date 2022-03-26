import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class AddMessageDto {
  @IsString()
  @MaxLength(250)
  text: string;

  @IsNumber()
  channelId: number;

  @IsNumber()
  userId: number;

  @IsOptional()
  replyMessageId?: string;
}
