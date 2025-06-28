/*
  Warnings:

  - You are about to drop the column `pinnedMessages` on the `chat_rooms` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `chat_rooms` DROP COLUMN `pinnedMessages`;

-- AlterTable
ALTER TABLE `messages` ADD COLUMN `pinned` BOOLEAN NOT NULL DEFAULT false;
