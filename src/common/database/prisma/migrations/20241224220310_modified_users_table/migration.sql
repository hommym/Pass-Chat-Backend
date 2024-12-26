-- AlterTable
ALTER TABLE `users` ADD COLUMN `isWebActive` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `webConnectionId` VARCHAR(191) NULL,
    MODIFY `onlineStatus` ENUM('online', 'offline', 'call', 'typing', 'recording') NOT NULL DEFAULT 'offline';
