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
import { CreateMeetingDto, CreateMemberDto } from 'src/modules/meetings/dto';
import { MeetingsService } from 'src/modules/meetings/services';

@Controller('meetings')
@UseInterceptors(ClassSerializerInterceptor)
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post('create')
  async create(@Body() meetingData: CreateMeetingDto) {
    return this.meetingsService.create(meetingData);
  }

  @UseGuards(JwtAuthenticationGuard)
  @Get(':id/:userId')
  async findOneByUserId(
    @Param('id') id: string,
    @Param('userId') userId: number,
  ) {
    console.log(id, userId);
    return this.meetingsService.getByUserId(id, userId);
  }

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post(':id/join-meeting')
  async joinMeeting(
    @Param('id') id: string,
    @Body() meetingData: CreateMemberDto,
  ) {
    return this.meetingsService.addMember(id, meetingData);
  }
}
