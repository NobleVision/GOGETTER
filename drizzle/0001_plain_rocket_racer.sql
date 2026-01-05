ALTER TABLE "users" ADD COLUMN "google_id" varchar(64);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "picture_url" varchar(500);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "auth_providers" json DEFAULT '[]'::json;