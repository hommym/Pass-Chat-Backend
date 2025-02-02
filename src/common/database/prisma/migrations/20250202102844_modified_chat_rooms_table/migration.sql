-- AlterTable
ALTER TABLE `chat_rooms` ADD COLUMN `status` ENUM('active', 'blocked') NULL;
