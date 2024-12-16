-- CreateTable
CREATE TABLE `user_contacts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ownerId` INTEGER NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `profile` LONGTEXT NULL,
    `status` ENUM('active', 'blocked') NOT NULL DEFAULT 'active',

    UNIQUE INDEX `user_contacts_ownerId_phone_key`(`ownerId`, `phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_contacts` ADD CONSTRAINT `user_contacts_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
