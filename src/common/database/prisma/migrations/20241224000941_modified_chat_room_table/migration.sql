/*
  Warnings:

  - You are about to drop the column `participants` on the `chat_rooms` table. All the data in the column will be lost.
  - You are about to alter the column `type` on the `chat_rooms` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `Enum(EnumId(4))`.
  - A unique constraint covering the columns `[user1Id,user2Id]` on the table `chat_rooms` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `chat_rooms` DROP COLUMN `participants`,
    ADD COLUMN `name` VARCHAR(191) NULL,
    ADD COLUMN `user1Id` INTEGER NULL,
    ADD COLUMN `user2Id` INTEGER NULL,
    MODIFY `type` ENUM('private', 'channel', 'group') NOT NULL DEFAULT 'private';

-- CreateIndex
CREATE UNIQUE INDEX `chat_rooms_user1Id_user2Id_key` ON `chat_rooms`(`user1Id`, `user2Id`);
