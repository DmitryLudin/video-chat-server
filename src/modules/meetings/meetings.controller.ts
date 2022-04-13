import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  HttpCode,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { LocalAuthenticationGuard } from 'src/modules/authentication/guards';
import { CreateMeetingDto } from 'src/modules/meetings/dto';
import { MeetingsService } from 'src/modules/meetings/services';

@Controller('meetings')
@UseInterceptors(ClassSerializerInterceptor)
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @HttpCode(200)
  @UseGuards(LocalAuthenticationGuard)
  @Post('create')
  async create(@Body() meetingData: CreateMeetingDto) {
    return this.meetingsService.create(meetingData);
  }
}
