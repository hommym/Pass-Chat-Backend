/*
  Warnings:

  - You are about to alter the column `type` on the `notifications` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(3))` to `Enum(EnumId(7))`.
  - A unique constraint covering the columns `[userId,communityId,platform]` on the table `notifications` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `communities` ADD COLUMN `deleteFlag` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `community_members` ADD COLUMN `deleteFlag` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `notifications` ADD COLUMN `communityId` INTEGER NULL,
    MODIFY `type` ENUM('private', 'system', 'call', 'community') NOT NULL DEFAULT 'private',
    MODIFY `action` ENUM('updateMessage', 'deleteMessage', 'saveMessage', 'deleteCommunity') NULL;

-- CreateIndex
CREATE UNIQUE INDEX `notifications_userId_communityId_platform_key` ON `notifications`(`userId`, `communityId`, `platform`);
