-- AlterTable
ALTER TABLE `communities` ADD COLUMN `status` ENUM('active', 'suspend', 'blocked') NOT NULL DEFAULT 'active';
