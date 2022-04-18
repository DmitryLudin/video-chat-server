import { IsNumber } from 'class-validator';

export class CreateMemberDto {
  @IsNumber()
  userId: number;
}
