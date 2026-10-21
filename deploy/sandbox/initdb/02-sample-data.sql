-- ข้อมูลตัวอย่าง (ชื่อสมมติทั้งหมด) วันที่ = วันที่สร้างฐานจำลอง
-- ถ้าข้ามวันแล้วรายการว่าง ให้สร้างฐานจำลองใหม่ (ดู deploy/sandbox/README.md)
SET NAMES utf8mb4;
USE webaranhos;
INSERT INTO queueUsers (username, password, fullname, updatedAt) VALUES
  ('test1', '$2b$10$/qgVDolowRvP5jGHTIB60uAWzZuJr5Lrre0Q/WKbVls3mqT3zVOt2', 'พยาบาลทดสอบ 1', NOW(3)),
  ('test2', '$2b$10$/qgVDolowRvP5jGHTIB60uAWzZuJr5Lrre0Q/WKbVls3mqT3zVOt2', 'พยาบาลทดสอบ 2', NOW(3));
INSERT INTO queueListCallnameDepartment (name, depcode, updatedAt) VALUES
  ('ห้องตรวจ 1', '010', NOW(3)), ('ห้องตรวจ 2', '010', NOW(3)), ('ช่องจ่ายยา 1', '202', NOW(3));
SET @today = DATE_FORMAT(CURDATE(), '%Y-%m-%d');
SET @yday = DATE_FORMAT(CURDATE() - INTERVAL 1 DAY, '%Y-%m-%d');
-- เมื่อวาน (ต้องไม่โผล่ในรายการวันนี้)
INSERT INTO queueService (hn, vn, display_text, oqueue, cur_dep, main_dep, department, vstdate, pname, fname, lname, status_call, updatedAt) VALUES
  ('000000090', 'Y0001', 'OP', 1, '010', '010', 'ตรวจโรคทั่วไป', @yday, 'นาย', 'เมื่อวาน', 'ทดสอบ', 'wait', NOW(3));
-- วันนี้
INSERT INTO queueService (hn, vn, display_text, oqueue, cur_dep, main_dep, department, vstdate, pname, fname, lname, status_call, updatedAt) VALUES
  ('000000001', 'T0001', 'OP', 1, '010', '010', 'ตรวจโรคทั่วไป', @today, 'นาย', 'สมชาย', 'ทดสอบ', 'wait', NOW(3)),
  ('000000002', 'T0002', 'OP', 2, '010', '010', 'ตรวจโรคทั่วไป', @today, 'นาง', 'สมหญิง', 'ทดสอบ', 'wait', NOW(3)),
  ('000000003', 'T0003', 'OP', 3, '010', '010', 'ตรวจโรคทั่วไป', @today, 'นางสาว', 'สมใจ', 'ทดสอบ', 'wait', NOW(3)),
  ('000000004', 'T0004', 'OP', 4, '010', '010', 'ตรวจโรคทั่วไป', @today, 'นาย', 'สมศักดิ์', 'ทดสอบ', 'wait', NOW(3)),
  ('000000005', 'T0005', 'OP', 5, '010', '010', 'ตรวจโรคทั่วไป', @today, 'ด.ช.', 'สมปอง', 'ทดสอบ', 'wait', NOW(3)),
  ('000000006', 'T0006', 'OP', 6, '010', '010', 'ตรวจโรคทั่วไป', @today, 'ด.ญ.', 'สมพร', 'ทดสอบ', 'wait', NOW(3)),
  ('000000001', 'T0001', NULL, 1, '202', '010', 'ห้องจ่ายยาผู้ป่วยนอก', @today, 'นาย', 'สมชาย', 'ทดสอบ', 'wait', NOW(3)),
  ('000000007', 'T0007', NULL, 7, '202', '010', 'ห้องจ่ายยาผู้ป่วยนอก', @today, 'นาง', 'สมศรี', 'ทดสอบ', 'wait', NOW(3)),
  ('000000008', 'T0008', NULL, 8, '202', '010', 'ห้องจ่ายยาผู้ป่วยนอก', @today, 'นาย', 'สมหมาย', 'ทดสอบ', 'wait', NOW(3));
USE hos;
CREATE TABLE kskdepartment (depcode CHAR(3) PRIMARY KEY, department VARCHAR(150), display_text VARCHAR(250), check_spclty_wb CHAR(1));
INSERT INTO kskdepartment VALUES
  ('010', 'ตรวจโรคทั่วไป', 'OP', 'Y'), ('202', 'ห้องจ่ายยาผู้ป่วยนอก', NULL, NULL), ('999', 'กลับบ้าน', NULL, NULL);
CREATE USER 'hos_ro'@'%' IDENTIFIED BY 'hos_ro';
GRANT SELECT ON hos.* TO 'hos_ro'@'%';
CREATE USER 'queue_app'@'%' IDENTIFIED BY 'queue_app';
GRANT SELECT, INSERT, UPDATE, DELETE ON webaranhos.* TO 'queue_app'@'%';
