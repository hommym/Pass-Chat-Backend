-- CreateTable
CREATE TABLE `subscription_plans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `interval` ENUM('month', 'year') NOT NULL DEFAULT 'month',
    `price` INTEGER NOT NULL,
    `benefit` JSON NOT NULL,
    `stripProductId` VARCHAR(191) NULL,
    `stripePriceId` VARCHAR(191) NULL,

    UNIQUE INDEX `subscription_plans_name_interval_key`(`name`, `interval`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
