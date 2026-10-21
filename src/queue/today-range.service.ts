import { Injectable, Logger } from '@nestjs/common';
import { todayStr } from '../common/dates';
import { PrismaService } from '../prisma/prisma.service';

/**
 * queueService ไม่มี index ที่ vstdate และมีข้อมูลสะสมตั้งแต่ปี 2024 (1.4 ล้านแถวขึ้นไป)
 * ถ้า query ด้วย vstdate อย่างเดียว จะต้องอ่านทั้งตารางทุกครั้ง (สาเหตุหลักที่ระบบเดิมช้า)
 *
 * โปรแกรม sync เดิมเพิ่มแถวของวันนี้ต่อท้ายตารางเสมอ แถวของวันนี้จึงเรียงต่อกันตาม id
 * service นี้หา id แรกของวันนี้ (ค้นแบบแบ่งครึ่งด้วย primary key ใช้ประมาณ 20 ครั้ง) แล้วเก็บไว้ทั้งวัน
 * ทุก query จะใส่ `id >= firstId` เพิ่มจาก `vstdate = วันนี้` ฐานข้อมูลจึงอ่านแค่แถวของวันนี้ ผลลัพธ์เหมือนเดิมทุกประการ
 */
@Injectable()
export class TodayRangeService {
  private readonly logger = new Logger(TodayRangeService.name);
  private cache: { date: string; firstId: number } | null = null;
  private emptyUntil: { date: string; until: number } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  /** id แรกของวันนี้ หรือ null ถ้าวันนี้ยังไม่มีแถว */
  async firstId(): Promise<number | null> {
    const date = todayStr();
    if (this.cache?.date === date) return this.cache.firstId;
    if (this.emptyUntil?.date === date && Date.now() < this.emptyUntil.until) return null;

    const max = await this.prisma.queueService.aggregate({ _max: { id: true } });
    let lo = 1;
    let hi = (max._max.id ?? 0) + 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      const row = await this.prisma.queueService.findFirst({
        where: { id: { gte: mid } },
        orderBy: { id: 'asc' },
        select: { vstdate: true },
      });
      if (!row || row.vstdate >= date) hi = mid;
      else lo = mid + 1;
    }
    const first = await this.prisma.queueService.findFirst({
      where: { id: { gte: lo }, vstdate: date },
      orderBy: { id: 'asc' },
      select: { id: true },
    });
    if (!first) {
      // ช่วงเช้ามืดที่ยังไม่มีคนไข้ ให้ลองหาใหม่ทุก 10 วินาที
      this.emptyUntil = { date, until: Date.now() + 10_000 };
      return null;
    }
    this.cache = { date, firstId: first.id };
    this.logger.log(`first queueService id of ${date} = ${first.id}`);
    return first.id;
  }

  /** เงื่อนไข where สำหรับแถวของวันนี้ (คืน null ถ้าวันนี้ยังไม่มีแถวเลย) */
  async where() {
    const firstId = await this.firstId();
    if (firstId === null) return null;
    return { id: { gte: firstId }, vstdate: todayStr() };
  }
}
