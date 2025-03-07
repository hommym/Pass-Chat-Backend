-- AlterTable
ALTER TABLE `messages` MODIFY `type` ENUM('text', 'video', 'audio', 'image', 'call', 'docs', 'contact', 'invitation', 'poll') NOT NULL DEFAULT 'text';
