-- AlterTable
ALTER TABLE `notifications` MODIFY `action` ENUM('updateMessage', 'deleteMessage', 'saveMessage', 'comunityInfoUpdate', 'deleteCommunity', 'updateChatRoom', 'phoneChange') NOT NULL;
