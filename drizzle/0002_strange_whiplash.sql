ALTER TABLE `products` ADD `reservationToken` varchar(96);--> statement-breakpoint
ALTER TABLE `products` ADD `reservationExpiresAt` timestamp;