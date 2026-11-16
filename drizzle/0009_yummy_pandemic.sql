ALTER TABLE `catalogAlbums` ADD `relatedGroupId` varchar(36);--> statement-breakpoint
ALTER TABLE `catalogAlbums` ADD `isHiddenFromDiscography` int DEFAULT 0 NOT NULL;