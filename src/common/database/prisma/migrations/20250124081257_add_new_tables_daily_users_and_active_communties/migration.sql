-- CreateTable
CREATE TABLE `daily_users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `platform` ENUM('android', 'ios', 'desktop') NOT NULL,
    `date` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `daily_users_userId_date_key`(`userId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `active_communities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `communityId` INTEGER NOT NULL,
    `date` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `active_communities_communityId_date_key`(`communityId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
