ALTER TYPE "public"."subscription_tier" ADD VALUE 'launch_pass' BEFORE 'starter';--> statement-breakpoint
ALTER TYPE "public"."subscription_tier" ADD VALUE 'enterprise' BEFORE 'unlimited';--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"content" text,
	"summary" text,
	"image_url" varchar(500),
	"infographic_url" varchar(500),
	"source_urls" json DEFAULT '[]'::json,
	"tags" json DEFAULT '[]'::json,
	"category" varchar(100),
	"status" varchar(32) DEFAULT 'published' NOT NULL,
	"ai_generated" boolean DEFAULT true NOT NULL,
	"prompt_outline" text,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"archived_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "credit_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"subscription_id" integer,
	"amount" integer NOT NULL,
	"balance_after" integer,
	"reason" varchar(64) NOT NULL,
	"description" text,
	"stripe_invoice_id" varchar(128),
	"stripe_payment_intent_id" varchar(128),
	"metadata" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_why_who" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"why_content" text NOT NULL,
	"who_content" text NOT NULL,
	"market_context" text,
	"source_urls" json DEFAULT '[]'::json,
	"linked_blog_post_ids" json DEFAULT '[]'::json,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_why_who_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "hot_100" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"summary" text,
	"entries" json DEFAULT '[]'::json,
	"source_urls" json DEFAULT '[]'::json,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hot_100_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "stripe_customer_id" varchar(128);--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "stripe_subscription_id" varchar(128);--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "stripe_price_id" varchar(128);--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "stripe_checkout_session_id" varchar(128);--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "status" varchar(64) DEFAULT 'inactive' NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "credits_remaining" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "credits_included" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "active_businesses_limit" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "launch_pass_activated_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_tier" "subscription_tier" DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" varchar(128);--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;