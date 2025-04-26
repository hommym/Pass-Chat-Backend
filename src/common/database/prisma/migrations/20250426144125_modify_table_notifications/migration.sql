-- AlterTable
ALTER TABLE `notifications` ADD COLUMN `storyId` INTEGER NULL,
    MODIFY `action` ENUM('updateMessage', 'deleteMessage', 'saveMessage', 'comunityInfoUpdate', 'deleteCommunity', 'updateChatRoom', 'clearChat', 'addStory', 'removeStory', 'phoneChange') NOT NULL;
