-- CreateTable
CREATE TABLE `daily_upload_quota` (
    `userId` INTEGER NOT NULL,
    `day` VARCHAR(191) NOT NULL,
    `quotaUsed` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `daily_upload_quota_userId_key`(`userId`),
    PRIMARY KEY (`userId`, `day`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
