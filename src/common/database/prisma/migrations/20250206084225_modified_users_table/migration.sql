/*
  Warnings:

  - A unique constraint covering the columns `[webConnectionId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `onlineStatusWeb` ENUM('online', 'offline', 'call', 'typing', 'recording') NOT NULL DEFAULT 'offline';

-- CreateIndex
CREATE UNIQUE INDEX `users_webConnectionId_key` ON `users`(`webConnectionId`);
