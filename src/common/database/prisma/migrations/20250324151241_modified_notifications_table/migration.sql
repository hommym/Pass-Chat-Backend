/*
  Warnings:

  - You are about to drop the column `twoFactorAuthId` on the `notifications` table. All the data in the column will be lost.
  - You are about to alter the column `type` on the `notifications` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(8))` to `Enum(EnumId(9))`.
  - Made the column `action` on table `notifications` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `notifications` DROP FOREIGN KEY `notifications_userId_fkey`;

-- DropIndex
DROP INDEX `notifications_twoFactorAuthId_key` ON `notifications`;

-- DropIndex
DROP INDEX `notifications_userId_communityId_platform_key` ON `notifications`;

-- DropIndex
DROP INDEX `notifications_userId_messageId_platform_key` ON `notifications`;

-- AlterTable
ALTER TABLE `notifications` DROP COLUMN `twoFactorAuthId`,
    MODIFY `type` ENUM('message', 'system', 'community', 'contact') NOT NULL DEFAULT 'message',
    MODIFY `action` ENUM('updateMessage', 'deleteMessage', 'saveMessage', 'comunityInfoUpdate', 'deleteCommunity', 'phoneChange') NOT NULL;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_communityId_fkey` FOREIGN KEY (`communityId`) REFERENCES `communities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;


