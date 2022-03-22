import { Module } from '@nestjs/common';
import { LogInWithCredentialsGuard } from 'src/modules/authentication/guards/log-in-with-credentials.guard';
import { LocalSerializer } from 'src/modules/authentication/strategy/local.serializer';
import { LocalStrategy } from 'src/modules/authentication/strategy/local.strategy';
import { AuthenticationService } from './authentication.service';
import { UsersModule } from '../users/users.module';
import { AuthenticationController } from './authentication.controller';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [UsersModule, PassportModule],
  providers: [
    AuthenticationService,
    LocalStrategy,
    LocalSerializer,
    LogInWithCredentialsGuard,
  ],
  controllers: [AuthenticationController],
})
export class AuthenticationModule {}
