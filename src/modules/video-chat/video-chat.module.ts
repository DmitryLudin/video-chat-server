import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationModule } from 'src/modules/authentication/authentication.module';
import { MeetingModule } from 'src/modules/meetings/meeting.module';
import { ConnectedUser } from 'src/modules/video-chat/entities';
import { ConnectedUsersService } from 'src/modules/video-chat/services';
import { UsersModule } from 'src/modules/users/users.module';
import { VideoChatGateway } from 'src/modules/video-chat/video-chat.gateway';
import { VideoChatService } from 'src/modules/video-chat/video-chat.service';

@Module({
  imports: [
    AuthenticationModule,
    TypeOrmModule.forFeature([ConnectedUser]),
    UsersModule,
    MeetingModule,
  ],
  providers: [VideoChatGateway, VideoChatService, ConnectedUsersService],
})
export class VideoChatModule {}
