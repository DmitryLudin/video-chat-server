import { IsNumber, IsString } from 'class-validator';

export class CreateConnectedUserDto {
  @IsString()
  socketId: string;

  @IsNumber()
  userId: number;
}
