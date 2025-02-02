-- AlterTable
ALTER TABLE `notifications` MODIFY `action` ENUM('updateMessage', 'deleteMessage', 'saveMessage', 'deleteCommunity', 'phoneChange') NULL;
