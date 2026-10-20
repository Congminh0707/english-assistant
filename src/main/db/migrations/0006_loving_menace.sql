CREATE TABLE `exercise_stats` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`day` text NOT NULL,
	`source` text NOT NULL,
	`kind` text NOT NULL,
	`skill` text NOT NULL,
	`correct` integer DEFAULT 0 NOT NULL,
	`total` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exercise_stats_unique` ON `exercise_stats` (`profile_id`,`day`,`source`,`kind`,`skill`);--> statement-breakpoint
CREATE TABLE `skill_ratings` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`skill` text NOT NULL,
	`rating` real NOT NULL,
	`games` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `skill_ratings_profile_skill` ON `skill_ratings` (`profile_id`,`skill`);