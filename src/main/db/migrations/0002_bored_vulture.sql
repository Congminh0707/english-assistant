CREATE TABLE `srs_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`card_id` text NOT NULL,
	`rating` integer NOT NULL,
	`state_before` integer NOT NULL,
	`due_before` integer NOT NULL,
	`elapsed_ms` integer,
	`source` text NOT NULL,
	`reviewed_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`card_id`) REFERENCES `srs_cards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `srs_reviews_profile_time` ON `srs_reviews` (`profile_id`,`reviewed_at`);