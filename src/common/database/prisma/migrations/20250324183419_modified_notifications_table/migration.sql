-- AlterTable
ALTER TABLE `notifications` ADD COLUMN `chatRoomId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_chatRoomId_fkey` FOREIGN KEY (`chatRoomId`) REFERENCES `chat_rooms`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
