import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthenticationGuard } from 'src/modules/authentication/guards';
import { ControllerHelperService } from 'src/modules/conferences/services';
import {
  IConnectMediaStreamDto,
  ICreateMediaStreamConsumerDto,
  ICreateMediaStreamProducerDto,
  IResumeMediaStreamConsumerDto,
} from 'src/modules/conferences/types/media-data.types';
import {
  ICreateMemberDto,
  ICreateRoomDto,
} from 'src/modules/conferences/types/room.types';

@Controller('conferences')
@UseInterceptors(ClassSerializerInterceptor)
export class ConferencesController {
  constructor(private readonly service: ControllerHelperService) {}

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post('create')
  async create(@Body() data: ICreateRoomDto) {
    return this.service.createRoom(data);
  }

  @UseGuards(JwtAuthenticationGuard)
  @Get(':id/:userId')
  async getRoomByIdAndUserId(
    @Param('id') id: string,
    @Param('userId') userId: number,
  ) {
    return this.service.getRoomByIdAndUserId(id, userId);
  }

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post(':id/join')
  async joinRoom(@Param('id') id: string, @Body() data: ICreateMemberDto) {
    return this.service.joinRoom(id, data);
  }

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post(':id/connect-media-stream')
  async connectMediaStreamTransport(
    @Param('id') id: string,
    @Body() data: IConnectMediaStreamDto,
  ) {
    return this.service.connectMediaStream(id, data);
  }

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post(':id/media-stream-producer')
  async createMediaStreamProducer(
    @Param('id') id: string,
    @Body() data: ICreateMediaStreamProducerDto,
  ) {
    const track = await this.service.createMediaStreamProducer(id, data);

    return { track };
  }

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post(':id/media-stream-consumer')
  async createMediaStreamConsumer(
    @Param('id') roomId: string,
    @Body() data: ICreateMediaStreamConsumerDto,
  ) {
    const track = await this.service.createMediaStreamConsumer(roomId, data);

    return { track };
  }

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post(':id/media-stream-consumer/resume')
  async resumeMediaStreamConsumer(
    @Param('id') roomId: string,
    @Body() data: IResumeMediaStreamConsumerDto,
  ) {
    await this.service.resumeMediaStreamConsumer(roomId, data);

    return { resumed: true };
  }
}
