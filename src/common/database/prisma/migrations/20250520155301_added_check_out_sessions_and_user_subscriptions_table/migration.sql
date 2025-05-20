-- CreateTable
CREATE TABLE `checkout_sessions` (
    `sessionId` VARCHAR(191) NOT NULL,
    `planId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`sessionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_subscriptions` (
    `subId` VARCHAR(191) NOT NULL,
    `stripeCustomerId` VARCHAR(191) NOT NULL,
    `planId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `status` ENUM('paid', 'unPaid', 'cancelled') NOT NULL DEFAULT 'paid',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_subscriptions_planId_userId_key`(`planId`, `userId`),
    PRIMARY KEY (`subId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_subscriptions` ADD CONSTRAINT `user_subscriptions_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `subscription_plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_subscriptions` ADD CONSTRAINT `user_subscriptions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
