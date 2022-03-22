import { Module } from '@nestjs/common';
import { AuthenticationController } from 'src/modules/authentication/authentication.controller';
import { AuthenticationService } from 'src/modules/authentication/authentication.service';
import { LogInWithCredentialsGuard } from 'src/modules/authentication/guards';
import {
  LocalSerializer,
  LocalStrategy,
} from 'src/modules/authentication/strategy';
import { UsersModule } from 'src/modules/users/users.module';
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
