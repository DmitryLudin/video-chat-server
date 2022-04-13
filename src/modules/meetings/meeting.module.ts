import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meeting, Message } from 'src/modules/meetings/entities';
import {
  MeetingsService,
  MessagesService,
} from 'src/modules/meetings/services';
import { MeetingsController } from './meetings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Meeting, Message])],
  providers: [MeetingsService, MessagesService],
  exports: [MeetingsService, MessagesService],
  controllers: [MeetingsController],
})
export class MeetingModule {}
