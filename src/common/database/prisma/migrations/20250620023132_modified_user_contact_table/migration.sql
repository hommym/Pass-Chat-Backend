-- AddForeignKey
ALTER TABLE `user_contacts` ADD CONSTRAINT `user_contacts_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `chat_rooms`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
