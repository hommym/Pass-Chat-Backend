-- AlterTable
ALTER TABLE `messages` ADD COLUMN `callType` ENUM('video', 'audio') NULL,
    MODIFY `type` ENUM('text', 'video', 'audio', 'image', 'call') NOT NULL DEFAULT 'text';
