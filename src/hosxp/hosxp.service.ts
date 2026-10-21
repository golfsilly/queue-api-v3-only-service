import { Global, Injectable, Logger, Module, OnModuleDestroy } from '@nestjs/common';
import * as mysql from 'mysql2/promise';
import { env } from '../config/env';

export interface KskDepartment {
  depcode: string;
  department: string;
  display_text?: string | null;
  check_spclty_wb?: string | null;
}

// เชื่อม HOSxP แบบอ่านอย่างเดียว
// ปล่อยให้ pool ของ mysql2 จัดการ connection เอง (keepAlive + เปิด connection ใหม่เมื่อ connection เดิมตาย)
// ไม่ต้องทดสอบ connection ก่อนทุก query และไม่ต้องสั่ง pool.end() เพื่อต่อใหม่เหมือนระบบเดิม
@Injectable()
export class HosxpService implements OnModuleDestroy {
  private readonly logger = new Logger(HosxpService.name);
  private readonly config = env().hosxp;
  private readonly pool = mysql.createPool({
    host: this.config.host,
    port: this.config.port,
    user: this.config.user,
    password: this.config.password,
    database: this.config.database,
    charset: 'TIS620',
    connectionLimit: this.config.connectionLimit,
    waitForConnections: true,
    queueLimit: 50,
    connectTimeout: 10000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    dateStrings: true,
  });

  private departments: { at: number; rows: KskDepartment[] } | null = null;

  async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const [rows] = await this.pool.query({ sql, timeout: this.config.queryTimeoutMs }, params);
    return rows as T[];
  }

  async ping(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  // ใช้ตอน login และตอนเลือกแผนก ถ้า HOSxP ล่มให้ใช้ค่าเก่าที่ cache ไว้ จะได้ยัง login ได้
  async listDepartments(): Promise<KskDepartment[]> {
    const ttlMs = 5 * 60 * 1000;
    if (this.departments && Date.now() - this.departments.at < ttlMs) {
      return this.departments.rows;
    }
    try {
      // เหมือนระบบเดิม: คืนทุกแถวของ kskdepartment
      const rows = await this.query<KskDepartment>('SELECT k.depcode, k.department FROM kskdepartment k');
      this.departments = { at: Date.now(), rows };
      return rows;
    } catch (error) {
      if (this.departments) {
        this.logger.warn(`kskdepartment unavailable, serving cache: ${(error as Error).message}`);
        return this.departments.rows;
      }
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}

@Global()
@Module({
  providers: [HosxpService],
  exports: [HosxpService],
})
export class HosxpModule {}
