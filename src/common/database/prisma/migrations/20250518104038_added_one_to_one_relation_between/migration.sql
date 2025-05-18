-- AddForeignKey
ALTER TABLE `stories` ADD CONSTRAINT `stories_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
