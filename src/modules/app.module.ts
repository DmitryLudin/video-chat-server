import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from '@hapi/joi';
import { UsersModule } from 'src/modules/users/users.module';
import { WebRtcModule } from 'src/modules/webrtc/webrtc.module';
import { DatabaseModule } from './database/database.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { ConferencesModule } from './conferences/conferences.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      validationSchema: Joi.object({
        POSTGRES_HOST: Joi.string().required(),
        POSTGRES_PORT: Joi.number().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_DB: Joi.string().required(),
        PORT: Joi.string().required(),
        WEBRTC_LISTEN_IP: Joi.string().required(),
        WEBRTC_ANNOUNCED_IP: Joi.string().required(),
        WEBRTC_MIN_PORT: Joi.string().required(),
        WEBRTC_MAX_PORT: Joi.string().required(),
        JWT_ACCESS_TOKEN_SECRET: Joi.string().required(),
        JWT_ACCESS_TOKEN_EXPIRATION_TIME: Joi.string().required(),
        JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),
        JWT_REFRESH_TOKEN_EXPIRATION_TIME: Joi.string().required(),
      }),
      cache: true,
    }),
    UsersModule,
    DatabaseModule,
    AuthenticationModule,
    WebRtcModule,
    ConferencesModule,
  ],
  controllers: [],
})
export class AppModule {}
