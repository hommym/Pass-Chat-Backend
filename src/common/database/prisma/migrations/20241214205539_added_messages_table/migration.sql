-- CreateTable
CREATE TABLE `mesages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('text', 'video', 'audio', 'image') NOT NULL DEFAULT 'text',
    `content` JSON NOT NULL,
    `senderId` INTEGER NOT NULL,
    `recipient` JSON NOT NULL,
    `roomId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `mesages` ADD CONSTRAINT `mesages_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `chat_rooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
