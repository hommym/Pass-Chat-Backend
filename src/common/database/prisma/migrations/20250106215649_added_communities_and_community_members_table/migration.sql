-- CreateTable
CREATE TABLE `communities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('group', 'channel') NOT NULL DEFAULT 'group',
    `visibility` ENUM('public', 'private') NOT NULL DEFAULT 'public',
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `roomId` INTEGER NOT NULL,
    `subscriberCount` INTEGER NOT NULL,
    `ownerId` INTEGER NOT NULL,
    `permissions` JSON NULL,

    UNIQUE INDEX `communities_type_name_key`(`type`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `community_members` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `communityId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `role` ENUM('owner', 'admin', 'member') NOT NULL DEFAULT 'member',

    UNIQUE INDEX `community_members_communityId_userId_key`(`communityId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `communities` ADD CONSTRAINT `communities_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `chat_rooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `communities` ADD CONSTRAINT `communities_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `community_members` ADD CONSTRAINT `community_members_communityId_fkey` FOREIGN KEY (`communityId`) REFERENCES `communities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
