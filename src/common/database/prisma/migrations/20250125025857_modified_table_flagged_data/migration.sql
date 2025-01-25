-- AlterTable
ALTER TABLE `flagged_data` ADD COLUMN `communityId` INTEGER NULL,
    MODIFY `type` ENUM('message', 'account', 'community') NOT NULL DEFAULT 'message';
