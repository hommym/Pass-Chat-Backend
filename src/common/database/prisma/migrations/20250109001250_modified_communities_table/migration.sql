/*
  Warnings:

  - Added the required column `invitationLink` to the `communities` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `communities` ADD COLUMN `invitationLink` VARCHAR(191) NOT NULL,
    MODIFY `subscriberCount` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `community_members` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
