import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import 'dotenv/config';
import { installProcessGuards } from './common/process-guards';
import { initEnv } from './config/env';

async function bootstrap() {
  const config = initEnv();
  installProcessGuards('queue-api');

  // import หลัง initEnv เพราะ provider บางตัวอ่าน env() ตอนสร้าง
  const { ApiModule } = await import('./api.module');
  const app = await NestFactory.create<NestExpressApplication>(ApiModule, {
    bufferLogs: false,
  });

  app.enableShutdownHooks();
  app.enableCors({
    origin: config.corsOrigins.includes('*') ? true : config.corsOrigins,
  });
  app.useBodyParser('json', { limit: '1mb' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.enableVersioning({ type: VersioningType.URI });

  await app.listen(config.port, '0.0.0.0');
  new Logger('queue-api').log(`listening on :${config.port}`);
}

void bootstrap();
