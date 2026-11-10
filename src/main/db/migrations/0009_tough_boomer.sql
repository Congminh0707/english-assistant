CREATE TABLE `diary_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`day` text NOT NULL,
	`text` text NOT NULL,
	`corrected` text,
	`changes_json` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `diary_entries_profile_day` ON `diary_entries` (`profile_id`,`day`);