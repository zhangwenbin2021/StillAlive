-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "checkInTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "streakCount" INTEGER NOT NULL,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "userId" TEXT NOT NULL,
    "miaThresholdHrs" INTEGER NOT NULL DEFAULT 24,
    "emergencyModeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emergencyModeEndTime" TIMESTAMP(3),
    "emergencyModeMultiplier" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "MiaNotification" (
    "userId" TEXT NOT NULL,
    "preAlertForCheckInId" TEXT,
    "emergencyForCheckInId" TEXT,
    "lastWordsForCheckInId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MiaNotification_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "AlertDelivery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "checkInId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LastWords" (
    "userId" TEXT NOT NULL,
    "message" TEXT,
    "deliveryThreshold" INTEGER NOT NULL DEFAULT 48,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LastWords_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "CheckIn_userId_checkInTime_idx" ON "CheckIn"("userId", "checkInTime" DESC);

-- CreateIndex
CREATE INDEX "EmergencyContact_userId_idx" ON "EmergencyContact"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmergencyContact_userId_email_key" ON "EmergencyContact"("userId", "email");

-- CreateIndex
CREATE INDEX "AlertDelivery_userId_idx" ON "AlertDelivery"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AlertDelivery_checkInId_contactId_type_key" ON "AlertDelivery"("checkInId", "contactId", "type");
