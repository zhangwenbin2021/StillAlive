import cron from "node-cron";
import { runMiaAlertSweep } from "@/lib/mia-alerts";

export function startMiaCron() {
  const globalForCron = globalThis as unknown as { __miaCronStarted?: boolean };
  if (globalForCron.__miaCronStarted) return;
  globalForCron.__miaCronStarted = true;

  // Run once at boot, then hourly.
  void runMiaAlertSweep();
  cron.schedule("0 * * * *", () => {
    void runMiaAlertSweep();
  });
}

