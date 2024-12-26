/*
  Warnings:

  - You are about to drop the column `read` on the `notifications` table. All the data in the column will be lost.
  - You are about to alter the column `type` on the `notifications` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(2))` to `Enum(EnumId(6))`.
  - You are about to drop the `mesages` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,messageId,platform]` on the table `notifications` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `mesages` DROP FOREIGN KEY `mesages_roomId_fkey`;

/* Drop the foreign key constraint that references `notifications_userId_key` */
ALTER TABLE `notifications` DROP FOREIGN KEY `notifications_userId_fkey`;

/* Drop the `notifications_userId_key` index */
DROP INDEX `notifications_userId_key` ON `notifications`;

-- AlterTable
ALTER TABLE `notifications` DROP COLUMN `read`,
    ADD COLUMN `messageId` INTEGER NULL,
    ADD COLUMN `platform` ENUM('mobile', 'browser') NOT NULL DEFAULT 'mobile',
    MODIFY `type` ENUM('message', 'system', 'call') NOT NULL DEFAULT 'message',
    MODIFY `data` JSON NULL;

-- DropTable
DROP TABLE `mesages`;

-- CreateTable
CREATE TABLE `messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('text', 'video', 'audio', 'image') NOT NULL DEFAULT 'text',
    `content` JSON NOT NULL,
    `senderId` INTEGER NOT NULL,
    `recipientId` INTEGER NULL,
    `roomId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `read` BOOLEAN NOT NULL DEFAULT false,
    `recieved` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `notifications_userId_messageId_platform_key` ON `notifications`(`userId`, `messageId`, `platform`);

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `chat_rooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
