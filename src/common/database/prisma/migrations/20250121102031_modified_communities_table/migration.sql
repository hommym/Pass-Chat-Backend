/*
  Warnings:

  - A unique constraint covering the columns `[type,ownerId,name]` on the table `communities` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `communities_type_name_key` ON `communities`;

-- AlterTable
ALTER TABLE `communities` MODIFY `invitationLink` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `communities_type_ownerId_name_key` ON `communities`(`type`, `ownerId`, `name`);
