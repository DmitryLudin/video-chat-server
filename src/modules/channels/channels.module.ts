import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel, Message } from 'src/modules/channels/entities';
import { UsersModule } from 'src/modules/users/users.module';
import { ChannelsService } from 'src/modules/channels/channels.service';

@Module({
  imports: [TypeOrmModule.forFeature([Channel, Message]), UsersModule],
  providers: [ChannelsService],
})
export class ChannelsModule {}
