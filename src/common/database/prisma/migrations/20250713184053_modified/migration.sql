-- AlterTable
ALTER TABLE `call_rooms` ADD COLUMN `callType` ENUM('video', 'audio') NOT NULL DEFAULT 'audio';
