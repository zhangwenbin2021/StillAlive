import Link from "next/link";
import crypto from "node:crypto";
import type { Metadata } from "next";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "排行榜 | Still Alive?",
  description: "StillALIVE 玩家签到连击排行榜（匿名展示）",
};

type LeaderboardRow = {
  userId: string;
  checkInTime: Date;
  streakCount: number;
};

function anonId(userId: string) {
  const hex = crypto.createHash("sha256").update(userId).digest("hex").slice(0, 8);
  return `幸存者 ${hex.toUpperCase()}`;
}

export default async function LeaderboardPage() {
  let rows: LeaderboardRow[] = [];
  let errorMessage: string | null = null;

  try {
    const prisma = getPrisma();
    rows = await prisma.$queryRaw<LeaderboardRow[]>`
      SELECT t."userId", t."checkInTime", t."streakCount"
      FROM (
        SELECT DISTINCT ON ("userId") "userId", "checkInTime", "streakCount"
        FROM "CheckIn"
        ORDER BY "userId", "checkInTime" DESC
      ) t
      ORDER BY t."streakCount" DESC, t."checkInTime" DESC
      LIMIT 50
    `;
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "无法加载排行榜";
  }

  return (
    <div className="sa-page">
      <div className="sa-shell">
        <header className="sa-card sa-card-pad">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-[color:var(--sa-fg)] sm:text-2xl">
                排行榜（按当前连击）
              </h1>
              <p className="mt-1 text-sm text-[color:var(--sa-muted)]">
                仅展示各玩家“最新一次签到”的连击数；玩家以匿名 ID 显示。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/" className="sa-btn sa-btn-soft">
                返回首页
              </Link>
              <Link href="/" className="sa-btn sa-btn-primary">
                登录并开始签到
              </Link>
            </div>
          </div>
        </header>

        <main className="sa-card sa-card-pad">
          {errorMessage ? (
            <div className="text-sm text-[color:var(--sa-muted)]">
              <p>排行榜暂时不可用。</p>
              <p className="mt-1 break-words">原因：{errorMessage}</p>
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-[color:var(--sa-muted)]">
              还没有人签到。你可以成为第一个“仍存活”的人。
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="text-xs text-[color:var(--sa-muted-2)]">
                    <th className="py-2 pr-3">排名</th>
                    <th className="py-2 pr-3">玩家</th>
                    <th className="py-2 pr-3">当前连击</th>
                    <th className="py-2">最近签到</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={r.userId} className="border-t border-black/5">
                      <td className="py-3 pr-3 font-semibold">{idx + 1}</td>
                      <td className="py-3 pr-3">{anonId(r.userId)}</td>
                      <td className="py-3 pr-3 font-semibold text-[color:var(--sa-accent)]">
                        {r.streakCount} 天
                      </td>
                      <td className="py-3 text-[color:var(--sa-muted)]">
                        {new Date(r.checkInTime).toLocaleString("zh-CN", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
