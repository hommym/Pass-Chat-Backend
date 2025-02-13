-- AlterTable
ALTER TABLE `users` ADD COLUMN `recentLoginDate` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `community_members` ADD CONSTRAINT `community_members_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
