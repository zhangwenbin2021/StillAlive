-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserSettings" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "miaThresholdHrs" INTEGER NOT NULL DEFAULT 24,
    "emergencyModeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emergencyModeEndTime" DATETIME,
    "emergencyModeMultiplier" INTEGER NOT NULL DEFAULT 2,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_UserSettings" ("createdAt", "miaThresholdHrs", "updatedAt", "userId") SELECT "createdAt", "miaThresholdHrs", "updatedAt", "userId" FROM "UserSettings";
DROP TABLE "UserSettings";
ALTER TABLE "new_UserSettings" RENAME TO "UserSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
