-- CreateTable
CREATE TABLE `two_factor_auths` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `otpCode` VARCHAR(191) NULL,

    UNIQUE INDEX `two_factor_auths_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
