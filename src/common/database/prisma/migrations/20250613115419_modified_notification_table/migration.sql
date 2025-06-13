-- AlterTable
ALTER TABLE `notifications` ADD COLUMN `subPlanId` INTEGER NULL,
    MODIFY `action` ENUM('updateMessage', 'deleteMessage', 'saveMessage', 'comunityInfoUpdate', 'deleteCommunity', 'updateChatRoom', 'clearChat', 'addStory', 'removeStory', 'communityInvitation', 'subSuccess', 'subFail', 'phoneChange') NOT NULL;
