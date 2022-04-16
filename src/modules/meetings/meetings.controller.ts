import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthenticationGuard } from 'src/modules/authentication/guards';
import { CreateMeetingDto } from 'src/modules/meetings/dto';
import { MeetingsService } from 'src/modules/meetings/services';

@Controller('meetings')
@UseInterceptors(ClassSerializerInterceptor)
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @UseGuards(JwtAuthenticationGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.meetingsService.getById(id);
  }

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post('create')
  async create(@Body() meetingData: CreateMeetingDto) {
    return this.meetingsService.create(meetingData);
  }

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post(':id/delete')
  async delete(@Param('id') id: string) {
    return this.meetingsService.endMeeting(id);
  }
}
