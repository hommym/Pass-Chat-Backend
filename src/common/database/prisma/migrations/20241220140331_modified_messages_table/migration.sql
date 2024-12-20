/*
  Warnings:

  - You are about to drop the column `recipient` on the `mesages` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `mesages` DROP COLUMN `recipient`,
    ADD COLUMN `read` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `recieved` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `recipientId` INTEGER NULL;
