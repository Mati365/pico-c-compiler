import {NestFactory, Reflector} from '@nestjs/core';
import {NestExpressApplication} from '@nestjs/platform-express';
import {ClassSerializerInterceptor} from '@nestjs/common';

import '@compiler/x86-nano-c';

import {ENV} from './constants/env';
import {LoggerInterceptor} from './interceptors/Logger.interceptor';
import {AppModule} from './app.module';

async function bootstrap(
  {
    address,
    port,
  }: {
    address: string,
    port: number,
  },
) {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {cors: true});
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new LoggerInterceptor,
  );

  await app.listen(port, address);
  console.info(`API server is running at http://${address}:${port}!`);
}

bootstrap(
  {
    address: ENV.listen.address,
    port: ENV.listen.port,
  },
);
