-- CreateTable
CREATE TABLE `chat_rooms` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('oneToOne', 'manyToMany', 'oneToMany') NOT NULL DEFAULT 'oneToOne',
    `participants` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
