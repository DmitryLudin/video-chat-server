import { Module } from '@nestjs/common';
import { AuthenticationModule } from 'src/modules/authentication/authentication.module';
import {
  ChatModule,
  MediaDataModule,
  MembersModule,
  RoomsModule,
} from 'src/modules/conferences/modules';
import {
  ControllerHelperService,
  GatewayHelperService,
} from 'src/modules/conferences/services';
import { UsersModule } from 'src/modules/users/users.module';
import { ConferencesController } from './conferences.controller';
import { ConferencesGateway } from './conferences.gateway';
import { MessagesModule } from './modules/messages/messages.module';

@Module({
  imports: [
    MembersModule,
    ChatModule,
    MediaDataModule,
    RoomsModule,
    AuthenticationModule,
    UsersModule,
    MessagesModule,
  ],
  providers: [
    ControllerHelperService,
    GatewayHelperService,
    ConferencesGateway,
  ],
  controllers: [ConferencesController],
})
export class ConferencesModule {}
