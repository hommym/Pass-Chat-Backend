-- AlterTable
ALTER TABLE `messages` ADD COLUMN `deleteFlag` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `notifications` ADD COLUMN `action` ENUM('updateMessage', 'deleteMessage', 'saveMessage') NULL;
