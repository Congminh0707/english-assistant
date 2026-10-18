CREATE TABLE `inventory_items` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`item_id` text NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_profile_item_unique` ON `inventory_items` (`profile_id`,`item_id`);--> statement-breakpoint
CREATE TABLE `pet_states` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`character_id` text NOT NULL,
	`name` text NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`total_xp` integer DEFAULT 0 NOT NULL,
	`coins` integer DEFAULT 0 NOT NULL,
	`hunger` real NOT NULL,
	`mood` real NOT NULL,
	`energy` real NOT NULL,
	`affection` integer DEFAULT 0 NOT NULL,
	`last_tick_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pet_states_profile_unique` ON `pet_states` (`profile_id`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`track` text NOT NULL,
	`is_child` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`scope` text NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`scope`, `key`)
);
--> statement-breakpoint
CREATE TABLE `xp_events` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`amount` integer NOT NULL,
	`coins` integer DEFAULT 0 NOT NULL,
	`reason` text NOT NULL,
	`ref_id` text,
	`multiplier` real DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `xp_events_profile_created` ON `xp_events` (`profile_id`,`created_at`);