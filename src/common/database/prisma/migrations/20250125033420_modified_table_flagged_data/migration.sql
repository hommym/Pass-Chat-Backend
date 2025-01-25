/*
  Warnings:

  - Added the required column `date` to the `flagged_data` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `flagged_data` ADD COLUMN `date` VARCHAR(191) NOT NULL,
    ADD COLUMN `timeStamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
