import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateChannelDto {
  @IsString()
  @IsOptional()
  @MaxLength(20)
  readonly name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  readonly description?: string;
}
