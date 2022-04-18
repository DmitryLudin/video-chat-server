import { Module } from '@nestjs/common';
import { AuthenticationModule } from 'src/modules/authentication/authentication.module';
import { MeetingModule } from 'src/modules/meetings/meeting.module';
import { UsersModule } from 'src/modules/users/users.module';
import { VideoChatGateway } from 'src/modules/video-chat/video-chat.gateway';
import { VideoChatService } from 'src/modules/video-chat/video-chat.service';

@Module({
  imports: [AuthenticationModule, UsersModule, MeetingModule],
  providers: [VideoChatGateway, VideoChatService],
})
export class VideoChatModule {}
