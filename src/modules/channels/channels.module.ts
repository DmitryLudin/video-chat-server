import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel, Message } from 'src/modules/channels/entities';
import {
  ChannelsService,
  MessagesService,
} from 'src/modules/channels/services';

@Module({
  imports: [TypeOrmModule.forFeature([Channel, Message])],
  providers: [ChannelsService, MessagesService],
  exports: [ChannelsService, MessagesService],
})
export class ChannelsModule {}
