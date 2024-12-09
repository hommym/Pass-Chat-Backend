/*
  Warnings:

  - You are about to drop the column `accountType` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `users` DROP COLUMN `accountType`,
    ADD COLUMN `bio` VARCHAR(191) NULL,
    ADD COLUMN `profile` LONGTEXT NULL,
    ADD COLUMN `role` ENUM('superAdmin', 'manager', 'moderator', 'analyst') NULL,
    ADD COLUMN `status` ENUM('active', 'suspend', 'blocked') NOT NULL DEFAULT 'active',
    ADD COLUMN `type` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    ADD COLUMN `username` VARCHAR(191) NULL;
