-- AlterTable
ALTER TABLE `messages` MODIFY `type` ENUM('text', 'video', 'audio', 'image', 'call', 'docs') NOT NULL DEFAULT 'text';
