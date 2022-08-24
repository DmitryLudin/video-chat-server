import { Module } from '@nestjs/common';
import {
  ChatModule,
  MediaDataModule,
  MembersModule,
  RoomsModule,
} from 'src/modules/conferences/modules';

import { MessagesModule } from './modules/messages/messages.module';

@Module({
  imports: [
    MembersModule,
    ChatModule,
    MediaDataModule,
    RoomsModule,
    MessagesModule,
  ],
})
export class ConferencesModule {}
