import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meeting, Member, Message } from 'src/modules/meetings/entities';
import { MeetingsService } from 'src/modules/meetings/meetings.service';
import { MemberService, MessagesService } from 'src/modules/meetings/services';

@Module({
  imports: [TypeOrmModule.forFeature([Meeting, Message, Member])],
  providers: [MeetingsService, MessagesService, MemberService],
  exports: [MeetingsService],
})
export class MeetingModule {}
