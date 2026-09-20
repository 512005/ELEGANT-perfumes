CREATE TABLE `orderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`productName` varchar(180) NOT NULL,
	`productPrice` int NOT NULL,
	`imageUrl` text,
	CONSTRAINT `orderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(48) NOT NULL,
	`customerName` varchar(160) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`governorate` varchar(100) NOT NULL,
	`area` varchar(100) NOT NULL,
	`address` text NOT NULL,
	`notes` text,
	`subtotal` int NOT NULL,
	`shippingFee` int NOT NULL DEFAULT 0,
	`total` int NOT NULL,
	`paymentMethod` enum('cash_on_delivery') NOT NULL DEFAULT 'cash_on_delivery',
	`status` enum('new','confirmed','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(180) NOT NULL,
	`description` text,
	`size` varchar(64),
	`price` int NOT NULL,
	`imageUrl` text,
	`status` enum('available','reserved','sold') NOT NULL DEFAULT 'available',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
