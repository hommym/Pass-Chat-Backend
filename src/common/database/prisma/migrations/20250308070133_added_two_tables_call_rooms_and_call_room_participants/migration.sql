-- CreateTable
CREATE TABLE `call_rooms` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('private', 'public') NOT NULL DEFAULT 'public',
    `creatorId` INTEGER NOT NULL,
    `communityId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `call_room_participants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `callRoomId` INTEGER NOT NULL,
    `participantId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `call_rooms` ADD CONSTRAINT `call_rooms_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `call_rooms` ADD CONSTRAINT `call_rooms_communityId_fkey` FOREIGN KEY (`communityId`) REFERENCES `communities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `call_room_participants` ADD CONSTRAINT `call_room_participants_callRoomId_fkey` FOREIGN KEY (`callRoomId`) REFERENCES `call_rooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `call_room_participants` ADD CONSTRAINT `call_room_participants_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
