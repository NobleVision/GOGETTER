CREATE TABLE "verification_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"code" varchar(8) NOT NULL,
	"type" varchar(32) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "permissions" json DEFAULT '{"businessCatalog":false,"myBusinesses":false,"monitoring":false,"tokenUsage":false,"apiConfig":false,"webhooks":false,"settings":false}'::json;