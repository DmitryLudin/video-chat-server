import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel, Message } from 'src/modules/channels/entities';
import { ChannelsService } from 'src/modules/channels/channels.service';

@Module({
  imports: [TypeOrmModule.forFeature([Channel, Message])],
  providers: [ChannelsService],
  controllers: [],
})
export class ChannelsModule {}
