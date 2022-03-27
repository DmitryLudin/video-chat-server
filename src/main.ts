import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { RedisIoAdapter } from 'src/adapters/redis-io.adapter';
import { AppModule } from 'src/modules/app.module';
import * as cookieParser from 'cookie-parser';
import { runInCluster } from 'src/utils/run-in-cluster.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidUnknownValues: true,
    }),
  );

  /** Подключение Redis для синхронизации разных кластеров для Websocket */
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis(
    configService.get('REDIS_HOST'),
    configService.get('REDIS_PORT'),
  );

  app.useWebSocketAdapter(redisIoAdapter);

  await app.listen(3000);
}

runInCluster(bootstrap);
