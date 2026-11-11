CREATE TABLE `free_writing_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`topic_id` text,
	`title` text NOT NULL,
	`task` text NOT NULL,
	`band` text NOT NULL,
	`length` text NOT NULL,
	`min_words` integer NOT NULL,
	`max_words` integer NOT NULL,
	`text` text NOT NULL,
	`word_count` integer NOT NULL,
	`feedback_json` text,
	`score` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `free_writing_entries_profile_created` ON `free_writing_entries` (`profile_id`,`created_at`);