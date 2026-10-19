CREATE TABLE `installed_packs` (
	`id` text PRIMARY KEY NOT NULL,
	`version` text NOT NULL,
	`path` text NOT NULL,
	`schema_version` integer NOT NULL,
	`sha256` text NOT NULL,
	`installed_at` integer NOT NULL,
	`enabled` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `saved_words` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`content_id` text,
	`text` text NOT NULL,
	`context` text,
	`lookup_count` integer DEFAULT 1 NOT NULL,
	`last_lookup_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `saved_words_profile_text_unique` ON `saved_words` (`profile_id`,`text`);--> statement-breakpoint
CREATE TABLE `srs_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`content_id` text NOT NULL,
	`direction` text NOT NULL,
	`context_sentence` text,
	`due` integer NOT NULL,
	`stability` real DEFAULT 0 NOT NULL,
	`difficulty` real DEFAULT 0 NOT NULL,
	`elapsed_days` integer DEFAULT 0 NOT NULL,
	`scheduled_days` integer DEFAULT 0 NOT NULL,
	`learning_steps` integer DEFAULT 0 NOT NULL,
	`reps` integer DEFAULT 0 NOT NULL,
	`lapses` integer DEFAULT 0 NOT NULL,
	`state` integer DEFAULT 0 NOT NULL,
	`last_review` integer,
	`suspended` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `srs_cards_profile_due` ON `srs_cards` (`profile_id`,`due`);--> statement-breakpoint
CREATE UNIQUE INDEX `srs_cards_profile_content_direction` ON `srs_cards` (`profile_id`,`content_id`,`direction`);