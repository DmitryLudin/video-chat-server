import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthenticationController } from 'src/modules/authentication/authentication.controller';
import { AuthenticationService } from 'src/modules/authentication/authentication.service';
import {
  JwtAuthenticationGuard,
  JwtRefreshGuard,
  LocalAuthenticationGuard,
} from 'src/modules/authentication/guards';
import {
  JwtRefreshTokenStrategy,
  JwtStrategy,
  LocalStrategy,
} from 'src/modules/authentication/strategies';
import { UsersModule } from 'src/modules/users/users.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: `${configService.get('JWT_EXPIRATION_TIME')}s`,
        },
      }),
    }),
  ],
  providers: [
    AuthenticationService,
    LocalStrategy,
    LocalAuthenticationGuard,
    JwtStrategy,
    JwtAuthenticationGuard,
    JwtRefreshTokenStrategy,
    JwtRefreshGuard,
  ],
  controllers: [AuthenticationController],
  exports: [AuthenticationService],
})
export class AuthenticationModule {}
