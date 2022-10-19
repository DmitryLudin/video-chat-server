import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  HttpCode,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthenticationGuard } from 'src/modules/authentication/guards';
import { MediaDataService } from 'src/modules/conferences/modules/media-data/media-data.service';
import {
  IConnectMediaStreamDto,
  ICreateMediaStreamConsumerDto,
  ICreateMediaDataDto,
  ICreateMediaStreamProducerDto,
  IResumeMediaStreamConsumerDto,
} from 'src/modules/conferences/types/media-data.types';

@Controller('conferences/media-data')
@UseInterceptors(ClassSerializerInterceptor)
export class MediaDataController {
  constructor(private readonly service: MediaDataService) {}

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post(':roomId/create')
  async createMediaData(
    @Param('roomId') roomId: string,
    @Body() data: ICreateMediaDataDto,
  ) {
    return this.service.create(roomId, data);
  }

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post(':roomId/add-stream')
  async addMediaStreamTransport(
    @Param('roomId') roomId: string,
    @Body() data: ICreateMediaDataDto,
  ) {
    return this.service.addMediaStream(roomId, data);
  }

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post(':roomId/connect-stream')
  async connectMediaStreamTransport(
    @Param('roomId') roomId: string,
    @Body() data: IConnectMediaStreamDto,
  ) {
    return this.service.connectMediaStream(roomId, data);
  }

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post(':roomId/create-stream-producer')
  async createMediaStreamProducer(
    @Param('roomId') roomId: string,
    @Body() data: ICreateMediaStreamProducerDto,
  ) {
    const track = await this.service.createMediaStreamProducer(roomId, data);

    return { track };
  }

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post(':roomId/create-stream-consumer')
  async createMediaStreamConsumer(
    @Param('roomId') roomId: string,
    @Body() data: ICreateMediaStreamConsumerDto,
  ) {
    const track = await this.service.createMediaStreamConsumer(roomId, data);

    return { track };
  }

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post(':roomId/resume-stream-consumer')
  async resumeMediaStreamConsumer(
    @Param('roomId') roomId: string,
    @Body() data: IResumeMediaStreamConsumerDto,
  ) {
    await this.service.resumeMediaStreamConsumer(roomId, data);

    return { resumed: true };
  }
}
