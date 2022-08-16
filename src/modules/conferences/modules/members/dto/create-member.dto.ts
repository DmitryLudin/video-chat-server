import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ICreateMemberDto } from 'src/modules/conferences/types/room.types';

export class CreateMemberDto implements ICreateMemberDto {
  @IsNumber()
  userId: number;

  @IsString()
  @IsOptional()
  displayName?: string;
}
