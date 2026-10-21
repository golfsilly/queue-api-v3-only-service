// วันที่ของระบบคิวยึดเวลาไทยเสมอ ไม่ขึ้นกับ timezone ของ server/container
const bangkokDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Bangkok',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** 'YYYY-MM-DD' ของวันนี้ตามเวลาไทย */
export function todayStr(): string {
  return bangkokDate.format(new Date());
}

/** วันนี้ (เวลาไทย) ในรูปที่ Prisma ใช้กับคอลัมน์ @db.Date */
export function todayDate(): Date {
  return new Date(`${todayStr()}T00:00:00.000Z`);
}

/** แปลงค่าคอลัมน์ @db.Date กลับเป็น 'YYYY-MM-DD' */
export function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}
