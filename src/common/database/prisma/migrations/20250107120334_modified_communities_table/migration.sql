-- AlterTable
ALTER TABLE `communities` ADD COLUMN `profile` LONGTEXT NULL,
    MODIFY `subscriberCount` INTEGER NOT NULL DEFAULT 0;
