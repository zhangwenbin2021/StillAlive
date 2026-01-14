import Link from "next/link";
import type { Metadata } from "next";
import { verifyShareToken } from "@/lib/share-token";

export const dynamic = "force-dynamic";

function getSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

export function generateMetadata({
  searchParams,
}: {
  searchParams: { t?: string };
}): Metadata {
  const baseUrl = getSiteUrl();
  const token = searchParams.t || "";
  const payload = token ? verifyShareToken(token) : null;

  const streak = payload?.streak ?? 0;
  const title = streak > 0 ? `连续 ${streak} 天仍存活 | Still Alive?` : "Still Alive?";
  const description =
    streak > 0
      ? `Still Alive? 玩家战绩：连续 ${streak} 天仍存活。每天 1 秒签到，记录连击，冲榜。`
      : "每天 1 秒签到，记录连击，冲榜。";
  const image = token ? `${baseUrl}/api/og?t=${encodeURIComponent(token)}` : `${baseUrl}/api/og`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default function SharePage({ searchParams }: { searchParams: { t?: string } }) {
  const token = searchParams.t || "";
  const payload = token ? verifyShareToken(token) : null;

  if (!payload) {
    return (
      <div className="sa-page">
        <div className="sa-shell">
          <div className="sa-card sa-card-pad">
            <h1 className="text-xl font-semibold text-[color:var(--sa-fg)]">分享链接无效或已过期</h1>
            <p className="mt-2 text-sm text-[color:var(--sa-muted)]">
              让对方重新生成分享链接即可。
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/" className="sa-btn sa-btn-primary">
                返回首页
              </Link>
              <Link href="/leaderboard" className="sa-btn sa-btn-soft">
                看看排行榜
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const streak = payload.streak;

  return (
    <div className="sa-page">
      <div className="sa-shell">
        <header className="sa-card sa-card-pad">
          <h1 className="text-2xl font-extrabold tracking-tight text-[color:var(--sa-accent)] sm:text-4xl">
            Still Alive?
          </h1>
          <p className="mt-2 text-sm text-[color:var(--sa-muted)]">
            Player #{payload.pid} · {payload.badge}
          </p>
        </header>

        <main className="sa-card sa-card-pad">
          <div className="text-center">
            <div className="text-5xl font-extrabold text-[color:var(--sa-accent)] sm:text-6xl">
              {streak}
            </div>
            <div className="mt-2 text-sm font-semibold text-[color:var(--sa-muted)]">
              连续天数仍存活
            </div>
            <p className="mt-4 text-sm text-[color:var(--sa-muted)]">
              每天 1 秒签到，记录连击、冲榜、分享你的“仍存活”战绩。
            </p>
          </div>

          <div className="mt-6 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
            <Link href="/" className="sa-btn sa-btn-primary sm:min-w-44">
              我也要签到
            </Link>
            <Link href="/leaderboard" className="sa-btn sa-btn-soft sm:min-w-44">
              查看排行榜
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
