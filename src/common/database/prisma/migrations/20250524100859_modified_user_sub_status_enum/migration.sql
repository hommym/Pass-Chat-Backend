-- AlterTable
ALTER TABLE `user_subscriptions` MODIFY `status` ENUM('paid', 'unPaid', 'pending', 'cancelled') NOT NULL DEFAULT 'paid';
