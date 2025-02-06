/*
  Warnings:

  - You are about to drop the column `isWebActive` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `users` DROP COLUMN `isWebActive`,
    ADD COLUMN `webLoggedIn` BOOLEAN NOT NULL DEFAULT false;
