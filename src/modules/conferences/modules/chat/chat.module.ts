import { Module } from '@nestjs/common';
import { AuthenticationModule } from 'src/modules/authentication/authentication.module';
import { MessagesModule } from 'src/modules/conferences/modules/messages/messages.module';
import { RoomsModule } from 'src/modules/conferences/modules/rooms';
import { ConferenceGatewayHelperService } from 'src/modules/conferences/services';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [MessagesModule, AuthenticationModule, RoomsModule],
  providers: [ChatService, ChatGateway, ConferenceGatewayHelperService],
})
export class ChatModule {}
