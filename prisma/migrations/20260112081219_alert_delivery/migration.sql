-- CreateTable
CREATE TABLE "AlertDelivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "checkInId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "AlertDelivery_userId_idx" ON "AlertDelivery"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AlertDelivery_checkInId_contactId_type_key" ON "AlertDelivery"("checkInId", "contactId", "type");
