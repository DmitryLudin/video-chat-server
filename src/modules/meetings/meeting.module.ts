import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meeting, Member, Message } from 'src/modules/meetings/entities';
import {
  MeetingsService,
  MemberService,
  MessagesService,
} from 'src/modules/meetings/services';
import { MeetingsController } from './meetings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Meeting, Message, Member])],
  providers: [MeetingsService, MessagesService, MemberService],
  exports: [MeetingsService, MessagesService, MemberService],
  controllers: [MeetingsController],
})
export class MeetingModule {}
