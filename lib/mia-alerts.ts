import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/notify";

const ALERT_TYPE_EMERGENCY_EMAIL = "EMERGENCY_EMAIL";
const ALERT_TYPE_LAST_WORDS_EMAIL = "LAST_WORDS_EMAIL";

const ALLOWED_THRESHOLDS = new Set([12, 24, 36, 48]);
const LAST_WORDS_THRESHOLDS = new Set([36, 48, 72]);

function fmtDateTime(date: Date) {
  const datePart = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  return `${datePart} - ${timePart}`;
}

export async function runMiaAlertSweep() {
  const baseUrl =
    process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const users = await prisma.userProfile.findMany({
    select: { userId: true, name: true, email: true },
  });

  for (const user of users) {
    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.userId },
      select: {
        miaThresholdHrs: true,
        emergencyModeEnabled: true,
        emergencyModeEndTime: true,
        emergencyModeMultiplier: true,
      },
    });

    if (settings?.emergencyModeEnabled) {
      const end = settings.emergencyModeEndTime;
      if (end && end.getTime() > Date.now()) continue;

      await prisma.userSettings.update({
        where: { userId: user.userId },
        data: {
          emergencyModeEnabled: false,
          emergencyModeEndTime: null,
          emergencyModeMultiplier: 2,
        },
      });
    }

    const last = await prisma.checkIn.findFirst({
      where: { userId: user.userId },
      orderBy: { checkInTime: "desc" },
      select: { id: true, checkInTime: true },
    });
    if (!last) continue;

    const threshold = ALLOWED_THRESHOLDS.has(settings?.miaThresholdHrs ?? 24)
      ? (settings?.miaThresholdHrs ?? 24)
      : 24;

    const now = new Date();
    const preAlertAt = new Date(last.checkInTime.getTime() + (threshold - 1) * 60 * 60 * 1000);
    const alertAt = new Date(last.checkInTime.getTime() + threshold * 60 * 60 * 1000);

    const state = await prisma.miaNotification.findUnique({
      where: { userId: user.userId },
      select: { preAlertForCheckInId: true, emergencyForCheckInId: true },
    });

    const needsPreAlert =
      now >= preAlertAt && now < alertAt && state?.preAlertForCheckInId !== last.id;

    if (needsPreAlert) {
      const subject = "Wake up! You're about to be marked as MIA!";
      const text =
        `Hey! You have 1 hour left to check in on Still Alive? to avoid alerting your contacts.\n\n` +
        `Check in here: ${baseUrl}/dashboard\n`;

      const res = await sendEmail(user.email, subject, text);
      if (res.ok) {
        await prisma.miaNotification.upsert({
          where: { userId: user.userId },
          create: { userId: user.userId, preAlertForCheckInId: last.id },
          update: { preAlertForCheckInId: last.id },
        });
      }
    }

    const needsEmergency = now >= alertAt && state?.emergencyForCheckInId !== last.id;
    if (!needsEmergency) continue;

    const contacts = await prisma.emergencyContact.findMany({
      where: { userId: user.userId },
      select: { id: true, email: true },
    });
    if (contacts.length === 0) continue;

    const userName = user.name || "Your friend";
    const lastCheckIn = fmtDateTime(last.checkInTime);

    const subject = `[Still Alive?] Emergency Alert: ${userName} may be MIA`;
    const body =
      `You're receiving this because ${userName} added you as an emergency contact on Still Alive?.\n\n` +
      `${userName} hasn't checked in for ${threshold} hours.\n` +
      `Last check-in: ${lastCheckIn}\n\n` +
      `Suggested actions:\n` +
      `1) Try calling/texting them.\n` +
      `2) If you can, check on them in person.\n` +
      `3) If you believe this is an emergency, contact local emergency services.\n\n` +
      `If they're fine, remind them to check in here: ${baseUrl}/dashboard\n`;

    let allOk = true;
    for (const c of contacts) {
      const existing = await prisma.alertDelivery.findUnique({
        where: {
          checkInId_contactId_type: {
            checkInId: last.id,
            contactId: c.id,
            type: ALERT_TYPE_EMERGENCY_EMAIL,
          },
        },
        select: { ok: true },
      });
      if (existing?.ok) continue;

      const res = await sendEmail(c.email, subject, body);
      await prisma.alertDelivery.upsert({
        where: {
          checkInId_contactId_type: {
            checkInId: last.id,
            contactId: c.id,
            type: ALERT_TYPE_EMERGENCY_EMAIL,
          },
        },
        create: {
          userId: user.userId,
          checkInId: last.id,
          contactId: c.id,
          type: ALERT_TYPE_EMERGENCY_EMAIL,
          ok: res.ok,
          error: res.ok ? null : res.error,
        },
        update: {
          ok: res.ok,
          error: res.ok ? null : res.error,
        },
      });

      if (!res.ok) allOk = false;
    }

    if (allOk) {
      await prisma.miaNotification.upsert({
        where: { userId: user.userId },
        create: { userId: user.userId, emergencyForCheckInId: last.id },
        update: { emergencyForCheckInId: last.id },
      });
    }

    const latestState = await prisma.miaNotification.findUnique({
      where: { userId: user.userId },
      select: { emergencyForCheckInId: true, lastWordsForCheckInId: true },
    });
    if (latestState?.emergencyForCheckInId !== last.id) continue;
    if (latestState?.lastWordsForCheckInId === last.id) continue;

    const lw = await prisma.lastWords.findUnique({
      where: { userId: user.userId },
      select: { message: true, deliveryThreshold: true },
    });
    if (!lw?.message) continue;

    const lwThreshold = LAST_WORDS_THRESHOLDS.has(lw.deliveryThreshold) ? lw.deliveryThreshold : 48;
    const lwAt = new Date(last.checkInTime.getTime() + lwThreshold * 60 * 60 * 1000);
    if (now < lwAt) continue;

    const subject2 = `Last Message from ${user.name || "User"} (Maybe -- Or They Just Forgot to Check In)`;
    const body2 =
      `This is a pre-written message from ${user.name || "User"} on Still Alive?.\n\n` +
      `It's being sent because they haven't checked in for ${lwThreshold} hours.\n\n` +
      `Their message:\n\n${lw.message}\n\n` +
      `-- Sent automatically by Still Alive?\n`;

    const emailRes = await sendEmail(user.email, subject2, body2);
    await prisma.alertDelivery.upsert({
      where: {
        checkInId_contactId_type: {
          checkInId: last.id,
          contactId: user.userId,
          type: ALERT_TYPE_LAST_WORDS_EMAIL,
        },
      },
      create: {
        userId: user.userId,
        checkInId: last.id,
        contactId: user.userId,
        type: ALERT_TYPE_LAST_WORDS_EMAIL,
        ok: emailRes.ok,
        error: emailRes.ok ? null : emailRes.error,
      },
      update: {
        ok: emailRes.ok,
        error: emailRes.ok ? null : emailRes.error,
      },
    });

    if (emailRes.ok) {
      await prisma.miaNotification.upsert({
        where: { userId: user.userId },
        create: { userId: user.userId, lastWordsForCheckInId: last.id },
        update: { lastWordsForCheckInId: last.id },
      });
    }
  }
}

