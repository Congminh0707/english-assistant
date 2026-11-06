CREATE TABLE `exam_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`exam` text NOT NULL,
	`mode` text NOT NULL,
	`part` integer,
	`correct` integer NOT NULL,
	`total` integer NOT NULL,
	`est_listening` integer,
	`est_reading` integer,
	`est_total` integer NOT NULL,
	`part_results` text NOT NULL,
	`elapsed_sec` integer NOT NULL,
	`finished_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `exam_attempts_profile_finished` ON `exam_attempts` (`profile_id`,`finished_at`);