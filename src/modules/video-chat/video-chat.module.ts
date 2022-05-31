import { Module } from '@nestjs/common';
import { AuthenticationModule } from 'src/modules/authentication/authentication.module';
import { UsersModule } from 'src/modules/users/users.module';
import {
  RoomsMediaDataService,
  MembersService,
  MessagesService,
  RoomsService,
} from 'src/modules/video-chat/services';
import { VideoChatController } from 'src/modules/video-chat/video-chat.controller';
import { VideoChatGateway } from 'src/modules/video-chat/video-chat.gateway';
import { VideoChatService } from 'src/modules/video-chat/video-chat.service';
import { WebRtcModule } from 'src/modules/webrtc/webrtc.module';

@Module({
  imports: [AuthenticationModule, UsersModule, WebRtcModule],
  providers: [
    VideoChatGateway,
    VideoChatService,
    RoomsService,
    MembersService,
    MessagesService,
    RoomsMediaDataService,
  ],
  controllers: [VideoChatController],
})
export class VideoChatModule {}
