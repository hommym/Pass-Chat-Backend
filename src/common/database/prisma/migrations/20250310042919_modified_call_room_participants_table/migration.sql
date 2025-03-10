/*
  Warnings:

  - A unique constraint covering the columns `[callRoomId,participantId]` on the table `call_room_participants` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `call_room_participants_callRoomId_participantId_key` ON `call_room_participants`(`callRoomId`, `participantId`);
