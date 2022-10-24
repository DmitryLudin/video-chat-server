import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { RedisIoAdapter } from 'src/adapters/redis-io.adapter';
import { cors } from 'src/constants/cors';
import { AppModule } from 'src/modules/app.module';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { runInCluster } from 'src/utils';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.enableCors(cors);
  app.use(helmet());
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidUnknownValues: true,
    }),
  );

  // /** Подключение Redis для синхронизации разных кластеров для Websocket */
  // const redisIoAdapter = new RedisIoAdapter(app);
  // await redisIoAdapter.connectToRedis(
  //   configService.get('REDIS_HOST'),
  //   configService.get('REDIS_PORT'),
  // );
  //
  // app.useWebSocketAdapter(redisIoAdapter);

  await app.listen(configService.get('PORT') || 3000);
}

runInCluster(bootstrap);
