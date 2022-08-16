import { Module } from '@nestjs/common';
import { MessagesModule } from 'src/modules/conferences/modules/messages/messages.module';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [MessagesModule],
  providers: [ChatService, ChatGateway],
})
export class ChatModule {}
