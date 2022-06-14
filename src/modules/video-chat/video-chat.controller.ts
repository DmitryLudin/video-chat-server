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
import {
  CreateMemberDto,
  CreateRoomDto,
  ReceiveTrackDto,
  ResumeReceiveTrackDto,
  SendTrackDto,
} from 'src/modules/video-chat/dto';
import { ConnectMediaStreamDto } from 'src/modules/video-chat/dto/connect-media-stream-transport.dto';
import { VideoChatService } from 'src/modules/video-chat/video-chat.service';

@Controller('video-chat')
@UseInterceptors(ClassSerializerInterceptor)
export class VideoChatController {
  constructor(private readonly videoChatService: VideoChatService) {}

  @UseGuards(JwtAuthenticationGuard)
  @Get('room/:id/:userId')
  async getRoomByIdAndUserId(
    @Param('id') id: string,
    @Param('userId') userId: number,
  ) {
    return this.videoChatService.getRoomByIdAndUserId(id, userId);
  }

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post('room/create')
  async create(@Body() data: CreateRoomDto) {
    return this.videoChatService.createRoom(data);
  }

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post('room/:id/join')
  async joinRoom(@Param('id') id: string, @Body() data: CreateMemberDto) {
    return this.videoChatService.joinRoom(id, data);
  }

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post('room/:id/connect-media-stream')
  async connectMediaStreamTransport(
    @Param('id') id: string,
    @Body() data: ConnectMediaStreamDto,
  ) {
    return this.videoChatService.connectMediaStream(id, data);
  }

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post('room/:id/send-track')
  async sendTrack(@Param('id') id: string, @Body() data: SendTrackDto) {
    const track = await this.videoChatService.sendTrack(id, data);

    return { track };
  }

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post('room/:id/receive-track')
  async receiveTrack(
    @Param('id') roomId: string,
    @Body() data: ReceiveTrackDto,
  ) {
    const track = await this.videoChatService.receiveTrack(roomId, data);

    return { track };
  }

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post('room/:id/resume-receive-track')
  async resumeReceiveTrack(
    @Param('id') roomId: string,
    @Body() data: ResumeReceiveTrackDto,
  ) {
    await this.videoChatService.resumeReceiveTrack(roomId, data);

    return { resumed: true };
  }
}
