function str(name: string, fallback?: string): string {
  const value = process.env[name];
  if (value !== undefined && value !== '') return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required environment variable: ${name}`);
}

function int(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value)) {
    throw new Error(`Environment variable ${name} must be an integer`);
  }
  return value;
}

function list(name: string, fallback: string): string[] {
  return str(name, fallback)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// อ่านค่าครั้งเดียวตอนเริ่ม process ถ้าขาดค่าที่จำเป็นจะ throw ทันที (container จะไม่ขึ้นแบบครึ่ง ๆ กลาง ๆ)
export function loadEnv() {
  return {
    port: int('PORT', 5600),
    // ฐาน webaranhos ตัวเดิม (ตาราง queueService / queueUsers / queueListCallnameDepartment)
    databaseUrl: str('DATABASE_URL'),
    hosxp: {
      host: str('HOSXP_HOST'),
      port: int('HOSXP_PORT', 3306),
      user: str('HOSXP_USER'),
      password: str('HOSXP_PASSWORD'),
      database: str('HOSXP_DATABASE', 'hos'),
      connectionLimit: int('HOSXP_CONNECTION_LIMIT', 5),
      queryTimeoutMs: int('HOSXP_QUERY_TIMEOUT_MS', 10000),
    },
    // ใช้เซ็น token ตอน login (ระบบเดิมใช้ NEXTAUTH_SECRET)
    jwtSecret: str('JWT_SECRET'),
    corsOrigins: list('CORS_ORIGINS', '*'),
  };
}

export type Env = ReturnType<typeof loadEnv>;

let current: Env | null = null;

export function initEnv(): Env {
  current = loadEnv();
  return current;
}

export function env(): Env {
  if (!current) throw new Error('initEnv() must be called before env()');
  return current;
}
