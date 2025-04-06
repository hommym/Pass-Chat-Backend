/*
  Warnings:

  - A unique constraint covering the columns `[ownerId,parentId,name,type]` on the table `files` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `files_ownerId_parentId_name_key` ON `files`;

-- CreateIndex
CREATE UNIQUE INDEX `files_ownerId_parentId_name_type_key` ON `files`(`ownerId`, `parentId`, `name`, `type`);
