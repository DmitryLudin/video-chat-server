import { Module } from '@nestjs/common';
import { AuthenticationModule } from 'src/modules/authentication/authentication.module';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

@Module({
  imports: [AuthenticationModule],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
