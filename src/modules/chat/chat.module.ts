import { Module } from '@nestjs/common';
import { AuthenticationModule } from 'src/modules/authentication/authentication.module';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [AuthenticationModule],
  providers: [ChatGateway],
})
export class ChatModule {}
