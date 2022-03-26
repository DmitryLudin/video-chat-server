import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateChannelDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  readonly name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  readonly description?: string;

  @IsOptional()
  @IsNumber()
  readonly ownerId?: number;

  @IsOptional()
  @IsBoolean()
  readonly isMeetingStarted?: boolean;

  @IsOptional()
  @IsArray()
  readonly members?: number[];
}
