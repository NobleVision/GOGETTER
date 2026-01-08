ALTER TABLE "businesses" ADD COLUMN "estimated_revenue_per_day" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "estimated_revenue_per_week" numeric(12, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "estimated_token_cost_per_day" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "estimated_token_cost_per_week" numeric(12, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "estimated_infra_cost_per_week" numeric(12, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "estimated_profit_per_hour" numeric(10, 4) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "estimated_profit_per_day" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "estimated_profit_per_week" numeric(12, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "agent_prompt" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "source" varchar(32) DEFAULT 'static';--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "discovered_by_user_id" integer;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "discovered_at" timestamp;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "last_refreshed_at" timestamp;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "last_deployed_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "terms_accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "privacy_policy_accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_discovered_by_user_id_users_id_fk" FOREIGN KEY ("discovered_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;