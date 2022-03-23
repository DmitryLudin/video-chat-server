import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Client } from 'connect-redis';
import { RedisIoAdapter } from 'src/adapters/redis-io.adapter';
import { AppModule } from 'src/modules/app.module';
import * as session from 'express-session';
import * as passport from 'passport';
import { createClient, RedisClientType } from 'redis';
import * as createRedisStore from 'connect-redis';
import { runInCluster } from 'src/utils/run-in-cluster.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidUnknownValues: true,
    }),
  );

  /** Подключение Redis Store для хранения сессий аутентификации */
  const RedisStore = createRedisStore(session);
  const redisClient = createClient({
    legacyMode: true,
    socket: {
      host: configService.get('REDIS_HOST'),
      port: configService.get('REDIS_PORT'),
    },
  }) as RedisClientType & Client;
  redisClient.connect().catch(console.error);

  app.use(
    session({
      store: new RedisStore({ client: redisClient }),
      secret: configService.get('SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
    }),
  );

  /** Подключение Redis для синхронизации разных кластеров для Websocket */
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis(
    configService.get('REDIS_HOST'),
    configService.get('REDIS_PORT'),
  );

  app.useWebSocketAdapter(redisIoAdapter);

  /** Инициализируем паспорт */
  app.use(passport.initialize());
  app.use(passport.session());

  await app.listen(3000);
}

runInCluster(bootstrap);
