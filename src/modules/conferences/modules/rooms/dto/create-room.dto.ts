import { IsNumber } from 'class-validator';
import { ICreateRoomDto } from 'src/modules/conferences/types/room.types';

export class CreateRoomDto implements ICreateRoomDto {
  @IsNumber()
  readonly ownerId: number;
}
