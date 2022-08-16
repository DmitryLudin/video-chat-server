import { IsString } from 'class-validator';

export class GetMessagesDto {
  @IsString()
  roomId: string;
}
