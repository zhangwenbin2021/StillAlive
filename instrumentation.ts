import { startMiaCron } from "@/lib/cron";

export async function register() {
  if (process.env.RUN_CRON !== "true") return;
  startMiaCron();
}

