-- AlterTable
ALTER TABLE `notifications` MODIFY `action` ENUM('updateMessage', 'deleteMessage', 'saveMessage', 'comunityInfoUpdate', 'deleteCommunity', 'updateChatRoom', 'clearChat', 'phoneChange') NOT NULL;

-- CreateTable
CREATE TABLE `cleared_chats_tracker` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roomId` INTEGER NOT NULL,
    `ownerId` INTEGER NOT NULL DEFAULT 0,
    `communityId` INTEGER NOT NULL DEFAULT 0,
    `clearedMessages` JSON NOT NULL,

    UNIQUE INDEX `cleared_chats_tracker_roomId_ownerId_communityId_key`(`roomId`, `ownerId`, `communityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
