-- CreateTable
CREATE TABLE `flagged_data` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('message', 'account') NOT NULL DEFAULT 'message',
    `flagger` ENUM('user', 'system') NOT NULL DEFAULT 'user',
    `reason` ENUM('spam', 'violence', 'hateSpeech', 'pornography') NOT NULL DEFAULT 'spam',
    `status` ENUM('pending', 'declined', 'approved') NOT NULL DEFAULT 'pending',
    `messageId` INTEGER NULL,
    `userId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
