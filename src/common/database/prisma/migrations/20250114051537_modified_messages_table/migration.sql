-- AlterTable
ALTER TABLE `messages` ADD COLUMN `comments` JSON NULL,
    ADD COLUMN `communityId` INTEGER NULL,
    ADD COLUMN `reactions` JSON NULL,
    ADD COLUMN `views` INTEGER NOT NULL DEFAULT 0;
