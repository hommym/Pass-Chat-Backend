/*
  Warnings:

  - You are about to alter the column `date` on the `active_communities` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Date`.

*/
-- AlterTable
ALTER TABLE `active_communities` MODIFY `date` DATE NOT NULL DEFAULT (CURRENT_DATE);

-- AlterTable
ALTER TABLE `daily_users` MODIFY `date` DATE NOT NULL DEFAULT (CURRENT_DATE);
