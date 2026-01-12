/*
  Warnings:

  - You are about to drop the column `messageEnc` on the `LastWords` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LastWords" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "message" TEXT,
    "deliveryThreshold" INTEGER NOT NULL DEFAULT 48,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_LastWords" ("deliveryThreshold", "updatedAt", "userId") SELECT "deliveryThreshold", "updatedAt", "userId" FROM "LastWords";
DROP TABLE "LastWords";
ALTER TABLE "new_LastWords" RENAME TO "LastWords";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
