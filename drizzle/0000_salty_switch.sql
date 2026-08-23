CREATE TABLE `publishedMeals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(128) NOT NULL,
	`name` varchar(255) NOT NULL,
	`carbonHundredths` int NOT NULL,
	`category` enum('Vegetarian','Non Vegetarian') NOT NULL,
	`estimateMethod` enum('published_research','prototype_estimate') NOT NULL,
	`sourceLabel` varchar(255) NOT NULL,
	`sourceUrl` varchar(512) NOT NULL,
	`sourcePublishedOn` varchar(16) NOT NULL,
	`factorsJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `publishedMeals_id` PRIMARY KEY(`id`),
	CONSTRAINT `publishedMeals_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `userMealLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientLogId` varchar(96) NOT NULL,
	`mealSlug` varchar(128) NOT NULL,
	`mealName` varchar(255) NOT NULL,
	`carbonHundredths` int NOT NULL,
	`servings` int NOT NULL,
	`category` enum('Vegetarian','Non Vegetarian') NOT NULL,
	`entryMethod` enum('camera','manual','custom') NOT NULL,
	`localDate` varchar(10) NOT NULL,
	`loggedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userMealLogs_id` PRIMARY KEY(`id`),
	CONSTRAINT `userMealLogs_user_client_log_unique` UNIQUE(`userId`,`clientLogId`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
ALTER TABLE `userMealLogs` ADD CONSTRAINT `userMealLogs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `userMealLogs_user_date_index` ON `userMealLogs` (`userId`,`localDate`);