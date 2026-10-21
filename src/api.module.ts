import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CompatV2Controller } from './compat-v2/compat-v2.controller';
import { env } from './config/env';
import { HealthController } from './health/health.controller';
import { HosxpModule } from './hosxp/hosxp.service';
import { PrismaModule } from './prisma/prisma.service';
import { QueuesService } from './queue/queues.service';
import { TodayRangeService } from './queue/today-range.service';
import { RealtimeGateway } from './realtime/realtime.gateway';

@Module({
  imports: [
    PrismaModule,
    HosxpModule,
    JwtModule.registerAsync({
      useFactory: () => ({ secret: env().jwtSecret }),
    }),
  ],
  controllers: [CompatV2Controller, HealthController],
  providers: [QueuesService, TodayRangeService, RealtimeGateway],
})
export class ApiModule {}
