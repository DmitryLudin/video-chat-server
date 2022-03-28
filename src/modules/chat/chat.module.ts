import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationModule } from 'src/modules/authentication/authentication.module';
import { ChannelsModule } from 'src/modules/channels/channels.module';
import { ConnectedUser, JoinedChannel } from 'src/modules/chat/entities';
import {
  ConnectedUserService,
  JoinedChannelService,
} from 'src/modules/chat/services';
import { UsersModule } from 'src/modules/users/users.module';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

@Module({
  imports: [
    AuthenticationModule,
    TypeOrmModule.forFeature([ConnectedUser, JoinedChannel]),
    UsersModule,
    ChannelsModule,
  ],
  providers: [
    ChatGateway,
    ChatService,
    JoinedChannelService,
    ConnectedUserService,
  ],
})
export class ChatModule {}
