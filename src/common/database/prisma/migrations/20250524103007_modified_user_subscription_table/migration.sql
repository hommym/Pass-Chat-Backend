/*
  Warnings:

  - A unique constraint covering the columns `[stripeCustomerId]` on the table `user_subscriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `user_subscriptions_stripeCustomerId_key` ON `user_subscriptions`(`stripeCustomerId`);
