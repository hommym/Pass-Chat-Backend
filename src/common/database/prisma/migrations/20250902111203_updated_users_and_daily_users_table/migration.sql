/*
  Warnings:

  - You are about to alter the column `date` on the `daily_users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Date`.

*/
-- AlterTable
ALTER TABLE `daily_users` MODIFY `date` DATE NOT NULL DEFAULT (CURRENT_DATE);

-- AlterTable
ALTER TABLE `users` ADD COLUMN `platform` ENUM('android', 'ios', 'desktop'),
    ADD COLUMN `timezone` VARCHAR(191);


DROP TRIGGER IF EXISTS `add_to_daily_users`;


CREATE TRIGGER `add_to_daily_users`
AFTER UPDATE ON `users`
FOR EACH ROW
BEGIN
    IF NOT EXISTS (
        SELECT `date`
        FROM daily_users
        WHERE userId = NEW.id
          AND `date` = CURDATE()
    ) AND (NEW.timezone IS NOT NULL) AND (NEW.platform IS NOT NULL) THEN
        INSERT INTO daily_users(userId, platform, timezone)
        VALUES (NEW.id, NEW.platform, NEW.timezone);
    END IF;
END;
