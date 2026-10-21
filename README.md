# Aran Queue Service (v3)

แยก API ของระบบคิวออกมาจาก `web-aranhos-api` เป็น service ของตัวเอง เพื่อให้เสถียรขึ้น
**ขั้นที่ 1: ทำงานเหมือนระบบเดิมทุกอย่าง และใช้ฐาน webaranhos ตัวเดิม** สลับมาใช้ได้โดยไม่กระทบระบบเดิม

## ใช้อะไรจากระบบเดิม
| | |
|---|---|
| ฐานข้อมูล | `webaranhos` ตาราง `queueService`, `queueUsers`, `queueListCallnameDepartment` **ไม่สร้าง ไม่แก้ และไม่ลบตาราง** |
| HOSxP | อ่าน `kskdepartment` (สำหรับ `kskdepart` และ `my-queue`) |
| ข้อมูลคิว | โปรแกรม sync เดิมยังเป็นคนเพิ่มแถวลง `queueService` ทุก 30 วินาทีเหมือนเดิม |
| API | `/api/v2/queues/*` path, เงื่อนไข และ response เหมือน `web-aranhos-api/src/queues/queues.service.ts` |
| Socket.IO | `queue/call-queue` → `queue/call-monitor/{dep}` + `queue/update-list-queue/{dep}` และ `queue/update-list-queue` → ส่งต่อให้ทุกเครื่อง เหมือนเดิม |

## ที่ต่างจากเดิม (เพื่อความเสถียร ไม่เปลี่ยนพฤติกรรม)
- **query เฉพาะแถวของวันนี้ผ่านช่วง `id`** แทนการสแกน `queueService` ทั้งตาราง (1.4 ล้านแถวขึ้นไป ไม่มี index ที่ vstdate) ผลลัพธ์เหมือนเดิม
  ทดสอบกับฐานจริงแล้ว: 50/51 endpoint ได้ผลตรงกับระบบเดิม (อีก 1 ตัวคือ `kskdepart` ตอนทดสอบ HOSxP login ไม่ผ่าน) ใช้เวลาประมาณ 7ms
- เรียกคิว (ปิดคิวที่กำลังเรียก + ตั้งคิวใหม่) ทำใน transaction เดียว
- เรียกคิวจะแก้เฉพาะแถวของวันนี้ ระบบเดิมแก้แถว `calling` ที่ค้างจากวันก่อน ๆ ด้วย ซึ่งไม่มีผลกับหน้าจอ
- `my-queue` ค้นเฉพาะ vn ของวันนี้
- login ไม่ส่ง password hash กลับมาใน response และใน token
- แยก process ของตัวเอง: Docker restart ให้เองเมื่อล่ม, มี `/health`, pool ของ HOSxP จัดการ connection เอง, socket ตั้ง ping ถี่ขึ้น

## ยังอยู่ที่ web-aranhos-api (ยังไม่ย้าย)
media display (`/queues/queue-midea-display`), limit-visit, clinic-map และโปรแกรม sync

## ติดตั้ง (Docker)
1. `cp .env.example .env` แล้วใส่ `DATABASE_URL` (ฐาน webaranhos), HOSxP และ `JWT_SECRET`
2. `docker compose up -d --build`
3. ตรวจสอบ: `curl http://localhost:5600/health` → `db: true`, `hosxp: true`, `todayFirstId`

ตั้งค่า AQueueCall: API URL = `http://<server>:5600/api/v2`, SOCKET URL = `http://<server>:5600`

## สลับให้ทุกเครื่องใช้ระบบใหม่ (ไม่ต้องแก้เครื่องพยาบาล)
nginx (`queue-proxy`, profile `proxy`) รับพอร์ต 5504 แทนตัวเดิม ตัวเดิมย้ายไป `127.0.0.1:5505`
- `deploy/nginx/queue-cutover.conf.tpl` = คิว + socket ไประบบใหม่ ที่เหลือไปตัวเดิม
- `deploy/nginx/all-to-old.conf.tpl` = ส่งทุกอย่างไปตัวเดิม (ย้อนกลับ)
- เส้นทางที่ใช้ = `deploy/nginx/default.conf` สลับด้วยการคัดลอกไฟล์แล้วรัน `docker compose --profile proxy restart queue-proxy` (ห้ามใช้ `nginx -s reload`)
- ขั้นตอนเต็มอยู่ในคู่มือติดตั้ง

## หมายเหตุ
- **ห้ามรัน `prisma migrate` / `prisma db push`** กับ `prisma/schema.prisma` เพราะฐาน webaranhos มีตารางของระบบอื่นอยู่ด้วย ใช้ได้แค่ `prisma generate`
- `npm run check:hosxp` = เช็กการเชื่อมต่อ HOSxP (อ่านอย่างเดียว)
