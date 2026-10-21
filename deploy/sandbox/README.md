# โหมดทดลอง (sandbox)

ระบบคิวใหม่กับฐานข้อมูลจำลองที่มีคนไข้ตัวอย่าง (ชื่อสมมติ) **ไม่แตะฐานจริงและ HOSxP จริง** กดเรียก/พัก/ข้ามได้ตามสบาย

## เริ่ม / หยุด (รันในโฟลเดอร์ `queue-api-v3-only-service`)
```bash
docker compose -f deploy/sandbox/docker-compose.sandbox.yml up -d --build   # เริ่ม
docker compose -f deploy/sandbox/docker-compose.sandbox.yml down            # หยุด
docker compose -f deploy/sandbox/docker-compose.sandbox.yml down -v         # หยุดและล้างข้อมูล (up ใหม่จะได้คิวของวันนั้น)
```
ข้อมูลตัวอย่างจะเป็นคิวของวันที่สร้างฐาน ถ้าข้ามวันแล้วรายการว่าง ให้ `down -v` แล้ว `up` ใหม่

## ลองใช้
1. เปิด AQueueCall → **ตั้งค่าระบบ** → API URL = `http://localhost:5600/api/v2`, SOCKET URL = `http://localhost:5600` → บันทึก
2. login: `test1` / `1234` (หรือ `test2`) แล้วเลือกแผนก **ตรวจโรคทั่วไป** (010) หรือ **ห้องจ่ายยาผู้ป่วยนอก** (202)
3. เลือกจุดบริการด้านบน (ห้องตรวจ 1 / ห้องตรวจ 2 / ช่องจ่ายยา 1) แล้วกดการ์ดคนไข้ → เรียกคิว / พักคิว / ข้ามคิว
4. เปิด `monitor.html` ในเบราว์เซอร์ = จอทีวีจำลอง เลขคิวจะขึ้นทันทีที่กดเรียก

ดูข้อมูลในฐานจำลอง: `docker exec -it aran-queue-sandbox-sandbox-db-1 mysql -uroot -psandbox-root webaranhos`
