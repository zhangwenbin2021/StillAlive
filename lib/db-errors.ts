export function getUserFacingDbError(err: unknown): string | null {
  if (!(err instanceof Error)) return null;
  const msg = err.message || "";

  // Common with PgBouncer / transaction poolers when prepared statements are enabled.
  if (msg.includes("prepared statement") && msg.includes("already exists")) {
    return (
      "数据库连接配置导致 Prisma 预处理语句冲突（PgBouncer/连接池）。\n" +
      "如果你在用 Supabase Pooler，请把 `DATABASE_URL` 改为带 `pgbouncer=true&statement_cache_size=0` 的连接串，或改用 Direct connection。"
    );
  }

  return null;
}
