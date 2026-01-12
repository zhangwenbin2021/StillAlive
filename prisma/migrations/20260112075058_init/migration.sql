-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "checkInTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "streakCount" INTEGER NOT NULL
);

-- CreateIndex
CREATE INDEX "CheckIn_userId_checkInTime_idx" ON "CheckIn"("userId", "checkInTime" DESC);
