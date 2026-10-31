-- Thiết kế v2: Lupo (Ngân Lang) thay Webby (nhện). Người đang dùng/sở hữu Webby chuyển sang Lupo.
UPDATE `pet_states` SET `name` = 'Lupo' WHERE `character_id` = 'webster' AND `name` = 'Webby';--> statement-breakpoint
UPDATE `pet_states` SET `character_id` = 'lupo' WHERE `character_id` = 'webster';--> statement-breakpoint
UPDATE `inventory_items` SET `item_id` = 'char:lupo' WHERE `item_id` = 'char:webster';
