/*
  Warnings:

  - You are about to alter the column `deleteFlag` on the `messages` table. The data in that column could be lost. The data in that column will be cast from `TinyInt` to `Enum(EnumId(8))`.

*/
-- AlterTable
ALTER TABLE `messages` MODIFY `deleteFlag` ENUM('sender', 'all') NULL;
