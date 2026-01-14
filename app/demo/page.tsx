import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "示例个人页 | Still Alive?",
  description: "StillALIVE 玩家签到连击与记录示例",
};

export default function DemoPage() {
  const demo = {
    streak: 17,
    recent: [
      { time: "2026-01-14 21:12", streak: 17 },
      { time: "2026-01-13 23:40", streak: 16 },
      { time: "2026-01-12 09:05", streak: 15 },
    ],
  };

  return (
    <div className="sa-page">
      <div className="sa-shell">
        <header className="sa-card sa-card-pad">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-[color:var(--sa-fg)] sm:text-2xl">
                示例个人页
              </h1>
              <p className="mt-1 text-sm text-[color:var(--sa-muted)]">
                登录后，你会看到自己的连击、最近签到记录，并能分享“仍存活”战绩。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/" className="sa-btn sa-btn-soft">
                返回首页
              </Link>
              <Link href="/" className="sa-btn sa-btn-primary">
                立即登录
              </Link>
            </div>
          </div>
        </header>

        <main className="grid gap-6 md:grid-cols-2">
          <section className="sa-card sa-card-pad">
            <h2 className="text-base font-semibold text-[color:var(--sa-fg)]">当前连击</h2>
            <div className="mt-4 flex items-baseline gap-3">
              <div className="text-5xl font-extrabold text-[color:var(--sa-accent)]">{demo.streak}</div>
              <div className="text-sm text-[color:var(--sa-muted)]">天</div>
            </div>
            <p className="mt-3 text-sm text-[color:var(--sa-muted)]">
              每天点一下签到按钮，连击就会增长；断签则归零。
            </p>
          </section>

          <section className="sa-card sa-card-pad">
            <h2 className="text-base font-semibold text-[color:var(--sa-fg)]">最近签到</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[320px] text-left text-sm">
                <thead>
                  <tr className="text-xs text-[color:var(--sa-muted-2)]">
                    <th className="py-2 pr-3">时间</th>
                    <th className="py-2">连击</th>
                  </tr>
                </thead>
                <tbody>
                  {demo.recent.map((r) => (
                    <tr key={r.time} className="border-t border-black/5">
                      <td className="py-3 pr-3 text-[color:var(--sa-muted)]">{r.time}</td>
                      <td className="py-3 font-semibold">{r.streak} 天</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 rounded-xl border border-black/10 bg-white/60 p-4 text-sm text-[color:var(--sa-muted)]">
              分享文案示例：我已经连续签到 17 天，仍然存活。来一起签到，别让队友以为你失踪了。
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
