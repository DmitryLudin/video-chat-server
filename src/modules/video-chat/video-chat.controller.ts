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
  ConnectWebRtcTransportDto,
  CreateWebRtcConsumerDto,
  CreateWebRtcProducerDto,
} from 'src/modules/video-chat/dto';
import { VideoChatService } from 'src/modules/video-chat/video-chat.service';

@Controller('video-chat')
@UseInterceptors(ClassSerializerInterceptor)
export class VideoChatController {
  constructor(private readonly videoChatService: VideoChatService) {}

  @UseGuards(JwtAuthenticationGuard)
  @Get('room/:id/:userId')
  async getRoomByIdAndUserId(
    @Param('id') id: string,
    @Body('userId') userId: number,
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
  @Post('room/:id/connect-transport')
  async connectWebRtcTransport(
    @Param('id') id: string,
    @Body() data: ConnectWebRtcTransportDto,
  ) {
    return this.videoChatService.connectWebRtcTransport(id, data);
  }

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post('room/:id/create-producer')
  async webRtcTransportProduce(
    @Param('id') id: string,
    @Body() data: CreateWebRtcProducerDto,
  ) {
    const producer = await this.videoChatService.createWebRtcProducer(id, data);

    return { producerId: producer.id };
  }

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post('room/:id/create-consumer')
  async webRtcTransportConsume(
    @Param('id') roomId: string,
    @Body() data: CreateWebRtcConsumerDto,
  ) {
    const { id, kind, rtpParameters } =
      await this.videoChatService.createWebRtcConsumer(roomId, data);

    return { id, kind, rtpParameters };
  }
}
