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
  @Get(':id')
  async getById(@Param('id') meetingId: string) {
    return this.meetingsService.getById(meetingId);
  }

  @UseGuards(JwtAuthenticationGuard)
  @Get(':id/:userId')
  async getByUserId(@Param('id') id: string, @Param('userId') userId: number) {
    return this.meetingsService.getByIdAndUserId(id, userId);
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

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post(':id/leave-meeting')
  async leaveMeeting(
    @Param('id') id: string,
    @Body() meetingData: { userId: number },
  ) {
    return this.meetingsService.deleteMember(id, meetingData.userId);
  }

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post(':id/end-meeting')
  async endMeeting(@Param('id') id: string) {
    return this.meetingsService.endMeeting(id);
  }
}
