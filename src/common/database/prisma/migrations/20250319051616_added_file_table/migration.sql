-- CreateTable
CREATE TABLE `files` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ownerId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('norm', 'dir') NOT NULL DEFAULT 'norm',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isRoot` BOOLEAN NOT NULL DEFAULT false,
    `dataUrl` VARCHAR(191) NULL,
    `parentId` INTEGER NULL,

    UNIQUE INDEX `files_ownerId_parentId_name_key`(`ownerId`, `parentId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `files`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
