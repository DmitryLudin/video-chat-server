import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from 'src/modules/conferences/entities';
import { MembersModule } from 'src/modules/conferences/modules/members';
import { MessagesModule } from 'src/modules/conferences/modules/messages/messages.module';
import { RoomsService } from './rooms.service';

@Module({
  imports: [TypeOrmModule.forFeature([Room]), MembersModule, MessagesModule],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
