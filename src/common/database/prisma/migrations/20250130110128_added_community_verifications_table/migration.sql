-- CreateTable
CREATE TABLE `community_verfications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `communityId` INTEGER NOT NULL,
    `websiteUrl` VARCHAR(191) NULL,
    `otherSocials` JSON NOT NULL,
    `supportingDocs` JSON NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `contact` VARCHAR(191) NOT NULL,
    `status` ENUM('pending', 'reviewed') NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `community_verfications` ADD CONSTRAINT `community_verfications_communityId_fkey` FOREIGN KEY (`communityId`) REFERENCES `communities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
