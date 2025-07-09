-- AlterTable
ALTER TABLE `notifications` MODIFY `action` ENUM('updateMessage', 'deleteMessage', 'saveMessage', 'comunityInfoUpdate', 'deleteCommunity', 'updateChatRoom', 'clearChat', 'addStory', 'removeStory', 'communityInvitation', 'subSuccess', 'subFail', 'phoneChange', 'contactUpdate') NOT NULL;
