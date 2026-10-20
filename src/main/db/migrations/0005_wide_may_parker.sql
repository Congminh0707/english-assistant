CREATE TABLE `usage_days` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`day` text NOT NULL,
	`seconds` integer DEFAULT 0 NOT NULL,
	`bonus_seconds` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usage_days_profile_day` ON `usage_days` (`profile_id`,`day`);