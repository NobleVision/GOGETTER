CREATE TYPE "public"."aggressiveness" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."api_provider" AS ENUM('manus', 'perplexity', 'openai', 'anthropic', 'gemini', 'grok');--> statement-breakpoint
CREATE TYPE "public"."business_status" AS ENUM('setup', 'running', 'paused', 'stopped', 'failed');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('revenue', 'cost', 'error', 'intervention', 'status_change', 'agent_activity');--> statement-breakpoint
CREATE TYPE "public"."risk_tolerance" AS ENUM('conservative', 'moderate', 'aggressive');--> statement-breakpoint
CREATE TYPE "public"."score_tier" AS ENUM('prime', 'stable', 'experimental', 'archived');--> statement-breakpoint
CREATE TYPE "public"."strategy_timeframe" AS ENUM('short', 'medium', 'long');--> statement-breakpoint
CREATE TYPE "public"."technical_skills" AS ENUM('beginner', 'intermediate', 'advanced', 'expert');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."vertical" AS ENUM('content_media', 'digital_services', 'ecommerce', 'data_insights');--> statement-breakpoint
CREATE TABLE "api_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"provider" "api_provider" NOT NULL,
	"api_key" varchar(500),
	"base_url" varchar(500),
	"is_active" boolean DEFAULT false NOT NULL,
	"last_validated" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_business_id" integer NOT NULL,
	"event_type" "event_type" NOT NULL,
	"event_data" json,
	"amount" numeric(10, 4),
	"message" text,
	"requires_intervention" boolean DEFAULT false NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"vertical" "vertical" NOT NULL,
	"guaranteed_demand" integer DEFAULT 50 NOT NULL,
	"automation_level" integer DEFAULT 50 NOT NULL,
	"token_efficiency" integer DEFAULT 50 NOT NULL,
	"profit_margin" integer DEFAULT 50 NOT NULL,
	"maintenance_cost" integer DEFAULT 50 NOT NULL,
	"legal_risk" integer DEFAULT 50 NOT NULL,
	"competition_saturation" integer DEFAULT 50 NOT NULL,
	"composite_score" integer DEFAULT 50 NOT NULL,
	"score_tier" "score_tier" DEFAULT 'experimental' NOT NULL,
	"estimated_revenue_per_hour" numeric(10, 4) DEFAULT '0',
	"estimated_token_cost_per_hour" numeric(10, 4) DEFAULT '0',
	"estimated_infra_cost_per_day" numeric(10, 2) DEFAULT '0',
	"setup_cost" numeric(10, 2) DEFAULT '0',
	"setup_time_hours" integer DEFAULT 1 NOT NULL,
	"min_agents_required" integer DEFAULT 1 NOT NULL,
	"recommended_models" json,
	"implementation_guide" text,
	"required_apis" json,
	"infra_requirements" json,
	"code_template_url" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"user_business_id" integer,
	"model_provider" varchar(64) NOT NULL,
	"model_name" varchar(128) NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"total_cost" numeric(10, 6) DEFAULT '0',
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_businesses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"business_id" integer NOT NULL,
	"status" "business_status" DEFAULT 'setup' NOT NULL,
	"total_revenue" numeric(14, 2) DEFAULT '0',
	"total_token_cost" numeric(14, 2) DEFAULT '0',
	"total_infra_cost" numeric(14, 2) DEFAULT '0',
	"net_profit" numeric(14, 2) DEFAULT '0',
	"daily_revenue" numeric(10, 2) DEFAULT '0',
	"daily_token_cost" numeric(10, 2) DEFAULT '0',
	"active_agents" integer DEFAULT 0 NOT NULL,
	"last_agent_activity" timestamp,
	"webhook_url" varchar(500),
	"config_json" json,
	"started_at" timestamp,
	"stopped_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"risk_tolerance" "risk_tolerance" DEFAULT 'moderate' NOT NULL,
	"capital_available" numeric(12, 2) DEFAULT '0',
	"interests" json,
	"technical_skills" "technical_skills" DEFAULT 'beginner' NOT NULL,
	"business_goals" json,
	"aggressiveness" "aggressiveness" DEFAULT 'medium' NOT NULL,
	"strategy_timeframe" "strategy_timeframe" DEFAULT 'medium' NOT NULL,
	"monthly_token_budget" numeric(10, 2) DEFAULT '100',
	"wizard_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"open_id" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"login_method" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_signed_in" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_open_id_unique" UNIQUE("open_id")
);
--> statement-breakpoint
CREATE TABLE "webhooks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"user_business_id" integer,
	"name" varchar(255) NOT NULL,
	"url" varchar(500) NOT NULL,
	"secret" varchar(128),
	"events" json,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_triggered" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_configs" ADD CONSTRAINT "api_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_events" ADD CONSTRAINT "business_events_user_business_id_user_businesses_id_fk" FOREIGN KEY ("user_business_id") REFERENCES "public"."user_businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_user_business_id_user_businesses_id_fk" FOREIGN KEY ("user_business_id") REFERENCES "public"."user_businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_businesses" ADD CONSTRAINT "user_businesses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_businesses" ADD CONSTRAINT "user_businesses_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_user_business_id_user_businesses_id_fk" FOREIGN KEY ("user_business_id") REFERENCES "public"."user_businesses"("id") ON DELETE no action ON UPDATE no action;