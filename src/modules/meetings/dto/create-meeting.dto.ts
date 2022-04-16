import { IsNumber } from 'class-validator';

export class CreateMeetingDto {
  @IsNumber()
  readonly ownerId: number;
}
