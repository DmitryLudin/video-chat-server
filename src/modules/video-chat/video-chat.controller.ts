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
import {
  ConnectWebRtcTransportDto,
  CreateConsumerDto,
  CreateWebRtcProducerDto,
} from 'src/modules/video-chat/dto';
import { VideoChatService } from 'src/modules/video-chat/video-chat.service';

@Controller('video-chat')
@UseInterceptors(ClassSerializerInterceptor)
export class VideoChatController {
  constructor(private readonly videoChatService: VideoChatService) {}

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post('meeting/create')
  async create(@Body() meetingData: CreateMeetingDto) {
    return this.videoChatService.createMeeting(meetingData);
  }

  @UseGuards(JwtAuthenticationGuard)
  @Get('meeting/:id')
  async getMeetingById(@Param('id') meetingId: string) {
    return this.videoChatService.getMeeting(meetingId);
  }

  @UseGuards(JwtAuthenticationGuard)
  @Get('meeting/:id/:userId')
  async getByUserId(@Param('id') id: string, @Body('userId') userId: number) {
    return this.videoChatService.checkUserJoinedMeeting(id, userId);
  }

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post('meeting/:id/join')
  async joinMeeting(
    @Param('id') id: string,
    @Body() meetingData: CreateMemberDto,
  ) {
    return this.videoChatService.joinMeeting(id, meetingData);
  }

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post('meeting/:id/leave')
  async leaveMeeting(
    @Param('id') id: string,
    @Body() meetingData: { userId: number },
  ) {
    return this.videoChatService.leaveMeeting(id, meetingData.userId);
  }

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post('meeting/:id/end')
  async endMeeting(@Param('id') id: string) {
    return this.videoChatService.endMeeting(id);
  }

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post('meeting/:id/connect-transport')
  async connectWebRtcTransport(
    @Param('id') id: string,
    @Body() data: ConnectWebRtcTransportDto,
  ) {
    return this.videoChatService.connectWebRtcTransport(id, data);
  }

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post('meeting/:id/create-producer')
  async webRtcTransportProduce(
    @Param('id') id: string,
    @Body() data: CreateWebRtcProducerDto,
  ) {
    const producer = await this.videoChatService.createWebRtcProducer(id, data);

    return { producerId: producer.id };
  }

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post('meeting/:id/create-consumer')
  async webRtcTransportConsume(
    @Param('id') meetingId: string,
    @Body() data: CreateConsumerDto,
  ) {
    const { id, kind, rtpParameters } =
      await this.videoChatService.createWebRtcConsumer(meetingId, data);

    return { id, kind, rtpParameters };
  }
}
