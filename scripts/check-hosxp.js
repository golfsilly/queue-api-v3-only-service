// เช็กการเชื่อมต่อ HOSxP จากค่าใน .env (ใช้แค่ SELECT ไม่แก้ข้อมูลใด ๆ)
// วิธีใช้: npm run check:hosxp
require('dotenv/config');
const mysql = require('mysql2/promise');

const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Bangkok',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());

const step = (ok, text) => console.log(`${ok ? '✔' : '✘'} ${text}`);

(async () => {
  const missing = ['HOSXP_HOST', 'HOSXP_USER', 'HOSXP_PASSWORD'].filter((k) => !process.env[k]);
  if (missing.length) {
    step(false, `ยังไม่ได้ใส่ค่าใน .env: ${missing.join(', ')}`);
    process.exit(1);
  }

  let conn;
  try {
    conn = await mysql.createConnection({
      host: process.env.HOSXP_HOST,
      port: Number(process.env.HOSXP_PORT || 3306),
      user: process.env.HOSXP_USER,
      password: process.env.HOSXP_PASSWORD,
      database: process.env.HOSXP_DATABASE || 'hos',
      charset: 'TIS620',
      connectTimeout: 10000,
      dateStrings: true,
    });
    step(true, `เชื่อมต่อ ${process.env.HOSXP_HOST}:${process.env.HOSXP_PORT || 3306}/${process.env.HOSXP_DATABASE || 'hos'} สำเร็จ`);
  } catch (e) {
    step(false, `เชื่อมต่อไม่ได้: ${e.code ?? ''} ${e.message}`);
    process.exit(1);
  }

  const q = async (sql, params = []) => (await conn.query({ sql, timeout: 15000 }, params))[0];

  const [info] = await q('SELECT VERSION() v, @@global.time_zone gtz, @@session.time_zone stz, NOW() now_db');
  step(true, `MySQL ${info.v} | time_zone global=${info.gtz} session=${info.stz} | NOW()=${info.now_db} | วันนี้ (เวลาไทย)=${today}`);

  const grants = await q('SHOW GRANTS FOR CURRENT_USER()');
  const grantText = grants.map((g) => Object.values(g)[0]).join('\n  ');
  const writable = /\b(INSERT|UPDATE|DELETE|ALL PRIVILEGES)\b/i.test(grantText);
  step(!writable, writable ? `user นี้เขียนข้อมูลได้ ควรใช้ user ที่ SELECT ได้อย่างเดียว:\n  ${grantText}` : 'user นี้ SELECT ได้อย่างเดียว');

  for (const table of ['ovst', 'patient', 'kskdepartment', 'lab_status', 'xray_head', 'ovst_seq']) {
    try {
      await q(`SELECT 1 FROM \`${table}\` LIMIT 1`);
      step(true, `อ่านตาราง ${table} ได้`);
    } catch (e) {
      step(false, `อ่านตาราง ${table} ไม่ได้: ${e.message}`);
    }
  }

  try {
    const [c] = await q('SELECT COUNT(*) n, COUNT(DISTINCT vn) vn, MIN(oqueue) minq, MAX(oqueue) maxq FROM ovst WHERE vstdate = ?', [today]);
    step(true, `ovst วันนี้: ${c.n} แถว, ${c.vn} vn, oqueue ${c.minq ?? '-'}–${c.maxq ?? '-'}`);

    const started = Date.now();
    const rows = await q('SELECT v.vn, v.cur_dep, k.department, k.display_text, v.oqueue, p.pname, p.fname FROM ovst v LEFT JOIN patient p ON p.hn = v.hn LEFT JOIN kskdepartment k ON k.depcode = v.cur_dep WHERE v.vstdate = ?', [today]);
    const vns = new Set(rows.map((r) => r.vn));
    step(true, `visit วันนี้: ${rows.length} แถว (${vns.size} vn ไม่ซ้ำ, ต้องตัดแถวซ้ำ ${rows.length - vns.size}) ใช้เวลา ${Date.now() - started}ms`);

    const byDep = {};
    for (const r of rows) byDep[`${r.cur_dep} ${r.department ?? ''}`] = (byDep[`${r.cur_dep} ${r.department ?? ''}`] ?? 0) + 1;
    console.log('  แผนกปัจจุบัน (cur_dep) ที่มีคนไข้มากที่สุด:');
    Object.entries(byDep).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, n]) => console.log(`    ${k}: ${n}`));
    const sample = rows.find((r) => r.fname);
    if (sample) console.log(`  ตัวอย่างการอ่านภาษาไทย: ${sample.department ?? ''} / ${sample.display_text ?? ''} ${sample.oqueue} / ${sample.pname ?? ''}${(sample.fname ?? '').slice(0, 1)}***`);
  } catch (e) {
    step(false, `query visit วันนี้ทำงานไม่ได้: ${e.message}`);
  }

  await conn.end();
})().catch((e) => {
  step(false, e.message);
  process.exit(1);
});
