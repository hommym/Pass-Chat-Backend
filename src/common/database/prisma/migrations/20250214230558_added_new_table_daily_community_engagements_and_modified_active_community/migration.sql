/*
  Warnings:

  - Added the required column `type` to the `active_communities` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `active_communities` ADD COLUMN `numberOfEngagement` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `type` ENUM('group', 'channel') NOT NULL;

-- CreateTable
CREATE TABLE `daily_community_engagements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `communityId` INTEGER NOT NULL,

    UNIQUE INDEX `daily_community_engagements_userId_communityId_date_key`(`userId`, `communityId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `active_communities` ADD CONSTRAINT `active_communities_communityId_fkey` FOREIGN KEY (`communityId`) REFERENCES `communities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
