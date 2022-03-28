import { IsNumber, IsString } from 'class-validator';

export class CreateJoinedChannelDto {
  @IsString()
  socketId: string;

  @IsNumber()
  userId: number;

  @IsNumber()
  channelId: number;
}
