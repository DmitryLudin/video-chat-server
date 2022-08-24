import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationModule } from 'src/modules/authentication/authentication.module';
import { Room } from 'src/modules/conferences/entities';
import { MembersModule } from 'src/modules/conferences/modules/members';
import { MessagesModule } from 'src/modules/conferences/modules/messages/messages.module';
import { ConferenceGatewayHelperService } from 'src/modules/conferences/services';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { RoomsGateway } from './rooms.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room]),
    MembersModule,
    MessagesModule,
    AuthenticationModule,
  ],
  providers: [RoomsService, RoomsGateway, ConferenceGatewayHelperService],
  exports: [RoomsService],
  controllers: [RoomsController],
})
export class RoomsModule {}
