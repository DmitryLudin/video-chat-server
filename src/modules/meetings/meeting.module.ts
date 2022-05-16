import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediasoupModule } from 'src/modules/mediasoup/mediasoup.module';
import { Meeting, Member, Message } from 'src/modules/meetings/entities';
import {
  MeetingsService,
  MemberService,
  MessagesService,
} from 'src/modules/meetings/services';
import { MeetingsController } from './meetings.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Meeting, Message, Member]),
    MediasoupModule,
  ],
  providers: [MeetingsService, MessagesService, MemberService],
  exports: [MeetingsService, MessagesService, MemberService],
  controllers: [MeetingsController],
})
export class MeetingModule {}
