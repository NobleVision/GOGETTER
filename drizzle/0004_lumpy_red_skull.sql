CREATE TYPE "public"."pipeline_status" AS ENUM('active', 'suspended', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'starter', 'pro', 'unlimited');--> statement-breakpoint
CREATE TABLE "pipeline_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"admin_id" integer NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"from_phase" integer,
	"to_phase" integer,
	"notes" text,
	"metadata" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"admin_id" integer NOT NULL,
	"business_name" varchar(255) NOT NULL,
	"poc_name" varchar(255) NOT NULL,
	"poc_email" varchar(320),
	"poc_phone" varchar(100),
	"referral_source" varchar(100),
	"phase" integer DEFAULT 0 NOT NULL,
	"status" "pipeline_status" DEFAULT 'active' NOT NULL,
	"description" text,
	"cloudinary_folder" varchar(500),
	"started_at" timestamp DEFAULT now() NOT NULL,
	"metadata" json DEFAULT '{}'::json,
	"subscription_tier" "subscription_tier" DEFAULT 'free',
	"retainer_paid" boolean DEFAULT false NOT NULL,
	"retainer_amount" numeric(10, 2) DEFAULT '0',
	"agreements_signed" json DEFAULT '{}'::json,
	"profit_share_percentage" numeric(5, 2) DEFAULT '40',
	"is_grandfathered" boolean DEFAULT false NOT NULL,
	"mvp_url" varchar(500),
	"mvp_expires_at" timestamp,
	"staging_expires_at" timestamp,
	"add_ons" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"monthly_price" numeric(10, 2) DEFAULT '0',
	"wizard_uses_this_month" integer DEFAULT 0 NOT NULL,
	"wizard_uses_limit" integer DEFAULT 1 NOT NULL,
	"token_rate_limit" integer DEFAULT 1000 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_master_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "pipeline_events" ADD CONSTRAINT "pipeline_events_project_id_pipeline_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."pipeline_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_events" ADD CONSTRAINT "pipeline_events_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_projects" ADD CONSTRAINT "pipeline_projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_projects" ADD CONSTRAINT "pipeline_projects_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;