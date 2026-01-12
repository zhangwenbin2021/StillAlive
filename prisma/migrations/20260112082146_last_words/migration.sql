-- AlterTable
ALTER TABLE "MiaNotification" ADD COLUMN "lastWordsForCheckInId" TEXT;

-- CreateTable
CREATE TABLE "LastWords" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "messageEnc" TEXT,
    "deliveryThreshold" INTEGER NOT NULL DEFAULT 48,
    "updatedAt" DATETIME NOT NULL
);
