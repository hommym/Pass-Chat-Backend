/*
  Warnings:

  - A unique constraint covering the columns `[connectionId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `connectionId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_connectionId_key` ON `users`(`connectionId`);
