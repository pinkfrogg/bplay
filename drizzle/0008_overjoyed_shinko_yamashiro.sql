CREATE TABLE `relatedAlbums` (
	`id` int AUTO_INCREMENT NOT NULL,
	`albumId` int NOT NULL,
	`relatedAlbumId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `relatedAlbums_id` PRIMARY KEY(`id`),
	CONSTRAINT `relatedAlbums_unique_idx` UNIQUE(`albumId`,`relatedAlbumId`)
);
--> statement-breakpoint
ALTER TABLE `relatedAlbums` ADD CONSTRAINT `relatedAlbums_albumId_catalogAlbums_id_fk` FOREIGN KEY (`albumId`) REFERENCES `catalogAlbums`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `relatedAlbums` ADD CONSTRAINT `relatedAlbums_relatedAlbumId_catalogAlbums_id_fk` FOREIGN KEY (`relatedAlbumId`) REFERENCES `catalogAlbums`(`id`) ON DELETE cascade ON UPDATE no action;