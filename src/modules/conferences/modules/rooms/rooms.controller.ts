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
import { RoomsService } from 'src/modules/conferences/modules/rooms/rooms.service';
import {
  ICreateMemberDto,
  ICreateRoomDto,
} from 'src/modules/conferences/types/room.types';

@Controller('conferences/rooms')
@UseInterceptors(ClassSerializerInterceptor)
export class RoomsController {
  constructor(private readonly service: RoomsService) {}

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post('create')
  async create(@Body() data: ICreateRoomDto) {
    return this.service.create(data);
  }

  @UseGuards(JwtAuthenticationGuard)
  @Get(':id/:userId')
  async getRoomByIdAndUserId(
    @Param('id') id: string,
    @Param('userId') userId: number,
  ) {
    return this.service.getByIdAndUserId(id, userId);
  }

  @HttpCode(200)
  @UseGuards(JwtAuthenticationGuard)
  @Post(':id/join')
  async joinRoom(@Param('id') id: string, @Body() data: ICreateMemberDto) {
    return this.service.addMember(id, data);
  }
}
