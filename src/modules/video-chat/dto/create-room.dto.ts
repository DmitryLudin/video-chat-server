import { IsNumber } from 'class-validator';

export class CreateRoomDto {
  @IsNumber()
  readonly ownerId: number;
}
