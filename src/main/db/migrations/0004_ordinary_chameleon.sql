CREATE TABLE `lesson_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`best` integer NOT NULL,
	`attempts` integer DEFAULT 1 NOT NULL,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lesson_progress_profile_lesson` ON `lesson_progress` (`profile_id`,`lesson_id`);