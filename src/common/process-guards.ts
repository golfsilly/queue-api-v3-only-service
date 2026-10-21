import { Logger } from '@nestjs/common';

// promise ที่ไม่มีใคร catch: log ไว้แต่ไม่ปิด process (ของเดิมทำให้ทั้ง API ล้ม)
// uncaughtException: state ของ process เชื่อไม่ได้แล้ว ให้ออกแล้ว Docker จะ restart ให้
export function installProcessGuards(name: string) {
  const logger = new Logger(name);
  process.on('unhandledRejection', (reason) => {
    logger.error(
      `Unhandled rejection: ${reason instanceof Error ? reason.stack : String(reason)}`,
    );
  });
  process.on('uncaughtException', (error) => {
    logger.error(`Uncaught exception, exiting: ${error.stack ?? error.message}`);
    process.exit(1);
  });
}
