ALTER TABLE `catalogAlbums` ADD `typeLabel` varchar(64);--> statement-breakpoint
ALTER TABLE `catalogAlbums` ADD `isHiddenFromDiscography` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `catalogAlbums` ADD `relatedGroupId` varchar(36);