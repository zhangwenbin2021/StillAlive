import { ImageResponse } from "next/og";
import { verifyShareToken } from "@/lib/share-token";

export const runtime = "nodejs";

function clampInt(n: number, min: number, max: number) {
  const x = Math.floor(n);
  return Math.max(min, Math.min(max, x));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("t") || "";
  const payload = token ? verifyShareToken(token) : null;

  const streak = payload ? clampInt(payload.streak, 0, 9999) : 0;
  const badge = payload?.badge ?? "Still Alive?";
  const pid = payload?.pid ?? "????";

  const title = streak > 0 ? `连续 ${streak} 天仍存活` : "仍存活（大概）";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          background:
            "radial-gradient(900px 420px at 18% 0%, rgba(249, 115, 22, 0.20), transparent 60%), radial-gradient(900px 420px at 82% 0%, rgba(251, 113, 133, 0.14), transparent 60%), radial-gradient(600px 320px at 50% 100%, rgba(34, 197, 94, 0.10), transparent 55%), linear-gradient(180deg, #fff7ed, #ffedd5)",
          color: "#0f172a",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial',
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 44, fontWeight: 800, color: "#f97316" }}>Still Alive?</div>
          <div
            style={{
              fontSize: 22,
              color: "rgba(15, 23, 42, 0.62)",
              padding: "10px 14px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.75)",
              border: "1px solid rgba(15,23,42,0.10)",
            }}
          >
            Player #{pid}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 72, fontWeight: 900, letterSpacing: "-0.02em" }}>{title}</div>
          <div style={{ fontSize: 30, color: "rgba(15, 23, 42, 0.62)" }}>{badge}</div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 20,
          }}
        >
          <div style={{ fontSize: 22, color: "rgba(15, 23, 42, 0.62)" }}>
            每天 1 秒签到，记录连击，冲榜。
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>
            stillalive.codezs.online
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
