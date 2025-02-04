/*
  Warnings:

  - A unique constraint covering the columns `[twoFactorAuthId]` on the table `notifications` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `notifications` ADD COLUMN `twoFactorAuthId` INTEGER NULL,
    MODIFY `action` ENUM('updateMessage', 'deleteMessage', 'saveMessage', 'deleteCommunity', 'phoneChange', 'showOtpCode') NULL;

-- CreateIndex
CREATE UNIQUE INDEX `notifications_twoFactorAuthId_key` ON `notifications`(`twoFactorAuthId`);
