import { Injectable, Logger } from '@nestjs/common';
import { Prisma, queueService } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { todayStr } from '../common/dates';
import { HosxpService } from '../hosxp/hosxp.service';
import { PrismaService } from '../prisma/prisma.service';
import { TodayRangeService } from './today-range.service';

// รูปแบบ response เดิม: { statusCode, results, message? }
export interface ResType {
  statusCode: number;
  results: unknown;
  message?: string;
}

export interface CallQueueBody {
  cur_dep?: string;
  vn?: string;
  dep_call?: string;
  cur_users_id?: number;
}

export interface LoginBody {
  username?: string;
  password?: string;
  department?: { depcode?: string; department?: string };
}

/**
 * logic เดียวกับ web-aranhos-api/src/queues/queues.service.ts ทุกฟังก์ชัน
 * (เงื่อนไข สถานะ ลำดับการเรียง และรูปแบบ response เหมือนเดิม)
 * ที่ต่างจากเดิมมี 3 อย่าง:
 *  1. query แถวของวันนี้ผ่านช่วง id (TodayRangeService) ไม่สแกนทั้งตาราง
 *  2. การเรียกคิว (ปิดคิวที่กำลังเรียก + ตั้งคิวใหม่) ทำใน transaction เดียว
 *  3. login ไม่ส่ง password hash กลับไปใน response และใน token
 */
@Injectable()
export class QueuesService {
  private readonly logger = new Logger(QueuesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hosxp: HosxpService,
    private readonly today: TodayRangeService,
    private readonly jwt: JwtService,
  ) {}

  private async guard(fn: () => Promise<ResType>): Promise<ResType> {
    try {
      return await fn();
    } catch (error) {
      this.logger.error((error as Error).message, (error as Error).stack);
      return { statusCode: 500, results: (error as Error).message };
    }
  }

  /** แถวของวันนี้ตามเงื่อนไขเดิม ถ้าวันนี้ยังไม่มีแถวเลยจะคืน [] */
  private async todayRows(
    where: Prisma.queueServiceWhereInput,
    orderBy: Prisma.queueServiceOrderByWithRelationInput,
  ): Promise<queueService[]> {
    const range = await this.today.where();
    if (!range) return [];
    return this.prisma.queueService.findMany({ where: { ...range, ...where }, orderBy });
  }

  authQueue(data: LoginBody): Promise<ResType> {
    return this.guard(async () => {
      const query = await this.prisma.queueUsers.findFirst({ where: { username: data.username } });
      if (query && data.password && (await bcrypt.compare(data.password, query.password))) {
        const { password: _password, ...user } = query;
        const jwt = this.jwt.sign({ sub: { ...user, department: data.department } });
        return { statusCode: 200, results: { ...user, department: data.department }, message: jwt };
      }
      return { statusCode: 301, results: 'error username' };
    });
  }

  myQueue(vn: string): Promise<ResType> {
    return this.guard(async () => {
      const range = await this.today.where();
      // ระบบเดิมค้นด้วย vn ทั้งตาราง vn มีวันที่อยู่ในตัวอยู่แล้ว จึงค้นเฉพาะแถวของวันนี้
      const query = range
        ? await this.prisma.queueService.findFirst({
            where: { id: range.id, vn },
            orderBy: { createdAt: 'desc' },
          })
        : null;
      if (!query) return { statusCode: 301, results: [], message: 'vn not found.' };

      const hosDepartSmart = await this.hosxp.query(
        `SELECT k.check_spclty_wb FROM kskdepartment k WHERE k.check_spclty_wb = 'Y' AND k.depcode = ?`,
        [query.cur_dep],
      );
      const queueInDep = await this.todayRows(
        { cur_dep: query.cur_dep, status_call: 'wait', vstdate: query.vstdate },
        { oqueue: 'asc' },
      );
      const queueCur = await this.todayRows(
        { cur_dep: query.cur_dep, status_call: 'calling', vstdate: query.vstdate },
        { oqueue: 'asc' },
      );
      // นับแบบเดียวกับระบบเดิม: ไล่คิวรอจากน้อยไปมาก จนเจอ vn ของตัวเอง
      let remainingQueue = 0;
      for (const item of queueInDep) {
        if (item.vn !== query.vn) remainingQueue++;
        else break;
      }
      return {
        statusCode: 200,
        results: {
          ...query,
          remainingQueue,
          queueCalling: queueCur,
          depUseSmartQueue: hosDepartSmart.length > 0,
        },
      };
    });
  }

  handleCallQueue(dto: CallQueueBody): Promise<ResType> {
    return this.guard(async () => {
      const range = await this.today.where();
      if (!range) return { statusCode: 200, results: { count: 0 } };
      const updateQueueNew = await this.prisma.$transaction(async (tx) => {
        await tx.queueService.updateMany({
          where: { id: range.id, cur_dep: dto.cur_dep, status_call: 'calling' },
          data: { status_call: 'success' },
        });
        return tx.queueService.updateMany({
          where: { id: range.id, vn: dto.vn, cur_dep: dto.cur_dep },
          data: { status_call: 'calling', cur_users_id: dto.cur_users_id },
        });
      });
      return { statusCode: 200, results: updateQueueNew };
    });
  }

  handleStayQueue(dto: CallQueueBody): Promise<ResType> {
    return this.guard(async () => {
      const range = await this.today.where();
      const updateQueue = range
        ? await this.prisma.queueService.updateMany({
            where: { id: range.id, cur_dep: dto.cur_dep, vn: dto.vn },
            data: { status_call: 'stay' },
          })
        : { count: 0 };
      return { statusCode: 200, results: updateQueue };
    });
  }

  handleAcrossQueue(dto: CallQueueBody): Promise<ResType> {
    return this.guard(async () => {
      const range = await this.today.where();
      const updateQueue = range
        ? await this.prisma.queueService.updateMany({
            where: { id: range.id, cur_dep: dto.cur_dep, vn: dto.vn },
            data: { status_call: 'success' },
          })
        : { count: 0 };
      return { statusCode: 200, results: updateQueue };
    });
  }

  nextQueue(curDep: string): Promise<ResType> {
    return this.guard(async () => ({
      statusCode: 200,
      results: await this.todayRows(
        { cur_dep: `${curDep}`, status_call: { in: ['calling', 'wait'] }, stay: false },
        { oqueue: 'asc' },
      ),
    }));
  }

  stayQueue(curDep: string): Promise<ResType> {
    return this.guard(async () => ({
      statusCode: 200,
      results: await this.todayRows(
        { cur_dep: curDep?.toString(), status_call: { in: ['stay', 'calling'] } },
        { oqueue: 'asc' },
      ),
    }));
  }

  historyQueue(curDep: string): Promise<ResType> {
    return this.guard(async () => ({
      statusCode: 200,
      results: await this.todayRows(
        { cur_dep: curDep?.toString(), status_call: { in: ['success', 'calling'] } },
        { updatedAt: 'desc' },
      ),
    }));
  }

  // ระบบเดิมใช้ query นี้กับ call-name และ pass-queue (pass-queue ไม่ได้แก้ข้อมูล)
  callName(curDep: string): Promise<ResType> {
    return this.guard(async () => ({
      statusCode: 200,
      results: await this.todayRows(
        { cur_dep: curDep?.toString(), status_call: { in: ['success', 'calling', 'stay'] } },
        { updatedAt: 'desc' },
      ),
    }));
  }

  searchQueue(slug: string): Promise<ResType> {
    return this.guard(async () => {
      const firstId = await this.today.firstId();
      if (firstId === null) return { statusCode: 200, results: [] };
      const slugText = `%${slug}%`;
      const query = await this.prisma.$queryRaw<queueService[]>`SELECT * FROM queueService qs
        WHERE qs.id >= ${firstId}
          AND (qs.hn LIKE ${slugText} OR CONCAT(qs.display_text,' ',qs.oqueue) LIKE ${slugText} OR CONCAT(qs.pname,qs.fname,' ',qs.lname) LIKE ${slugText})
          AND qs.vstdate = ${todayStr()}
        ORDER BY qs.id`;
      // เหมือนเดิม: 1 vn คืนแค่แถวแรกที่เจอ
      const seen = new Set<string>();
      return { statusCode: 200, results: query.filter((row) => !seen.has(row.vn) && seen.add(row.vn)) };
    });
  }

  findAllKskdepart(): Promise<ResType> {
    return this.guard(async () => ({
      statusCode: 200,
      results: (await this.hosxp.listDepartments()).map((d) => ({ depcode: d.depcode, department: d.department })),
    }));
  }

  callNameByDepcode(curDep: string): Promise<ResType> {
    return this.guard(async () => ({
      statusCode: 200,
      results: await this.prisma.queueListCallnameDepartment.findMany({
        where: { depcode: curDep, isActive: true },
      }),
    }));
  }
}
