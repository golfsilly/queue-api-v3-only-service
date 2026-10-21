import { Controller, Get, Res, VERSION_NEUTRAL } from '@nestjs/common';
import { Response } from 'express';
import { HosxpService } from '../hosxp/hosxp.service';
import { PrismaService } from '../prisma/prisma.service';
import { TodayRangeService } from '../queue/today-range.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

// HTTP 503 เฉพาะตอนที่ฐาน webaranhos ต่อไม่ได้ (เรียกคิวไม่ได้จริง) ถ้า HOSxP ล่มยังตอบ 200 แต่บอกไว้ใน body
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hosxp: HosxpService,
    private readonly today: TodayRangeService,
    private readonly gateway: RealtimeGateway,
  ) {}

  @Get()
  async health(@Res({ passthrough: true }) res: Response) {
    const started = Date.now();
    let db = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      db = true;
    } catch {
      db = false;
    }
    const dbMs = Date.now() - started;
    const hosxp = await this.hosxp.ping();
    const todayFirstId = db ? await this.today.firstId().catch(() => null) : null;
    res.status(db ? 200 : 503);
    return {
      status: db ? 'ok' : 'error',
      time: new Date().toISOString(),
      db,
      dbMs,
      hosxp,
      todayFirstId,
      sockets: this.gateway.connectedCount(),
    };
  }
}
