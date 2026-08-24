CREATE TABLE `communityModerationCases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postClientId` varchar(96) NOT NULL,
	`displayName` varchar(40) NOT NULL,
	`mealsLogged` int NOT NULL,
	`weeklyFootprintHundredths` int NOT NULL,
	`message` varchar(180) NOT NULL,
	`reportedByUserId` int NOT NULL,
	`status` enum('reported','restored','hidden','removed') NOT NULL DEFAULT 'reported',
	`reportedAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `communityModerationCases_id` PRIMARY KEY(`id`),
	CONSTRAINT `communityModerationCases_post_client_unique` UNIQUE(`postClientId`)
);
--> statement-breakpoint
CREATE TABLE `moderationAuditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`moderationCaseId` int NOT NULL,
	`teacherUserId` int NOT NULL,
	`action` enum('restored','hidden','removed') NOT NULL,
	`reason` enum('private_information','unkind_or_harmful','off_topic','safety_concern','other') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `moderationAuditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','teacher','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `communityModerationCases` ADD CONSTRAINT `communityModerationCases_reportedByUserId_users_id_fk` FOREIGN KEY (`reportedByUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `moderationAuditLogs` ADD CONSTRAINT `moderationAudit_case_fk` FOREIGN KEY (`moderationCaseId`) REFERENCES `communityModerationCases`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `moderationAuditLogs` ADD CONSTRAINT `moderationAudit_teacher_fk` FOREIGN KEY (`teacherUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `communityModerationCases_status_reported_index` ON `communityModerationCases` (`status`,`reportedAt`);--> statement-breakpoint
CREATE INDEX `moderationAuditLogs_case_created_index` ON `moderationAuditLogs` (`moderationCaseId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `moderationAuditLogs_teacher_created_index` ON `moderationAuditLogs` (`teacherUserId`,`createdAt`);
