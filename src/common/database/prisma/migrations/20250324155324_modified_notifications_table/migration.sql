/*
  Warnings:

  - You are about to drop the column `type` on the `notifications` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `notifications` DROP COLUMN `type`;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
