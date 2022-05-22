import { Module } from '@nestjs/common';
import { AuthenticationModule } from 'src/modules/authentication/authentication.module';
import { MeetingModule } from 'src/modules/meetings/meeting.module';
import { UsersModule } from 'src/modules/users/users.module';
import { VideoChatController } from 'src/modules/video-chat/video-chat.controller';
import { VideoChatGateway } from 'src/modules/video-chat/video-chat.gateway';
import { VideoChatService } from 'src/modules/video-chat/video-chat.service';
import { WebRtcModule } from 'src/modules/webrtc/webrtc.module';

@Module({
  imports: [AuthenticationModule, UsersModule, MeetingModule, WebRtcModule],
  providers: [VideoChatGateway, VideoChatService],
  controllers: [VideoChatController],
})
export class VideoChatModule {}
