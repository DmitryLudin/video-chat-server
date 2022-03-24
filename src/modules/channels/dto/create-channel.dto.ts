import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateChannelDto {
  @IsString()
  @MaxLength(20)
  readonly name: string;

  @IsString()
  @MaxLength(60)
  readonly description: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsBoolean()
  isMeetingStarted?: boolean;
}
