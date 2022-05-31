import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMemberDto {
  @IsNumber()
  userId: number;

  @IsString()
  @IsOptional()
  displayName?: string;
}
