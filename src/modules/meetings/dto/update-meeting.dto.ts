import { IsArray, IsNumber, IsOptional } from 'class-validator';

export class UpdateMeetingDto {
  @IsOptional()
  @IsNumber()
  readonly ownerId?: number;

  @IsOptional()
  @IsArray()
  readonly memberIds?: number[];
}
