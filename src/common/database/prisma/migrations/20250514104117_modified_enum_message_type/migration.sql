-- AlterTable
ALTER TABLE `messages` MODIFY `type` ENUM('text', 'video', 'audio', 'image', 'call', 'docs', 'contact', 'invitation', 'poll', 'story') NOT NULL DEFAULT 'text';
