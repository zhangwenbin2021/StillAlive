-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmationToken" TEXT,
    "confirmationExpires" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "miaThresholdHrs" INTEGER NOT NULL DEFAULT 24,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MiaNotification" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "preAlertForCheckInId" TEXT,
    "emergencyForCheckInId" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "EmergencyContact_userId_idx" ON "EmergencyContact"("userId");

-- CreateIndex
CREATE INDEX "EmergencyContact_confirmationToken_idx" ON "EmergencyContact"("confirmationToken");

-- CreateIndex
CREATE UNIQUE INDEX "EmergencyContact_userId_phone_key" ON "EmergencyContact"("userId", "phone");
