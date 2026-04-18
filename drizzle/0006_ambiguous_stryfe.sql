CREATE TYPE "public"."call_log_status" AS ENUM('queued', 'in_progress', 'completed', 'missed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."call_log_type" AS ENUM('zoom_meeting', 'inbound_call', 'outbound_call', 'agent_session');--> statement-breakpoint
CREATE TYPE "public"."scheduled_voice_action_status" AS ENUM('scheduled', 'queued', 'running', 'completed', 'cancelled', 'failed');--> statement-breakpoint
CREATE TYPE "public"."scheduled_voice_action_type" AS ENUM('zoom_join', 'direct_call', 'inbound_wait', 'zoom_host', 'custom');--> statement-breakpoint
CREATE TYPE "public"."voice_access_level" AS ENUM('admin', 'operator', 'sales', 'support', 'observer');--> statement-breakpoint
CREATE TYPE "public"."voice_agent_mode" AS ENUM('listen', 'interact', 'business', 'project_management', 'development', 'custom');--> statement-breakpoint
CREATE TYPE "public"."zoom_meeting_status" AS ENUM('scheduled', 'active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "ai_voice_agents" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"eleven_labs_voice_id" varchar(128) NOT NULL,
	"eleven_labs_agent_id" varchar(128),
	"avatar_url" varchar(500),
	"description" text,
	"access_level" "voice_access_level" DEFAULT 'operator' NOT NULL,
	"default_mode" "voice_agent_mode" DEFAULT 'listen' NOT NULL,
	"emotions_enabled" boolean DEFAULT true NOT NULL,
	"emotion_triggers" json DEFAULT '[]'::json,
	"modes_config" json DEFAULT '[]'::json,
	"tags" json DEFAULT '[]'::json,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "call_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"call_log_id" integer NOT NULL,
	"user_id" integer,
	"pipeline_project_id" integer,
	"content_type" varchar(64) NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text,
	"content_json" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "call_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"agent_id" integer,
	"zoom_meeting_id" integer,
	"pipeline_project_id" integer,
	"type" "call_log_type" NOT NULL,
	"status" "call_log_status" DEFAULT 'queued' NOT NULL,
	"direction" varchar(32) DEFAULT 'outbound' NOT NULL,
	"external_call_id" varchar(128),
	"phone_number" varchar(100),
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"transcript" text,
	"summary" text,
	"transcript_url" varchar(500),
	"recording_url" varchar(500),
	"subtitles_url" varchar(500),
	"sentiment_analysis" json DEFAULT '{}'::json,
	"live_events" json DEFAULT '[]'::json,
	"metadata" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_voice_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" integer,
	"user_id" integer,
	"zoom_meeting_id" integer,
	"type" "scheduled_voice_action_type" NOT NULL,
	"mode" "voice_agent_mode" DEFAULT 'listen' NOT NULL,
	"status" "scheduled_voice_action_status" DEFAULT 'scheduled' NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"execute_now" boolean DEFAULT false NOT NULL,
	"metadata" json DEFAULT '{}'::json,
	"last_run_at" timestamp,
	"created_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zoom_meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject" varchar(255) NOT NULL,
	"description" text,
	"host_user_id" integer,
	"zoom_meeting_external_id" varchar(128),
	"join_url" varchar(500),
	"start_url" varchar(500),
	"passcode" varchar(64),
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"duration_minutes" integer DEFAULT 30 NOT NULL,
	"timezone" varchar(64) DEFAULT 'America/New_York' NOT NULL,
	"invitees" json DEFAULT '[]'::json,
	"agenda" json DEFAULT '[]'::json,
	"status" "zoom_meeting_status" DEFAULT 'scheduled' NOT NULL,
	"experimental_video_enabled" boolean DEFAULT false NOT NULL,
	"metadata" json DEFAULT '{}'::json,
	"created_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_image_url" varchar(500);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ai_confirmation_code" varchar(20);--> statement-breakpoint
ALTER TABLE "ai_voice_agents" ADD CONSTRAINT "ai_voice_agents_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_content" ADD CONSTRAINT "call_content_call_log_id_call_logs_id_fk" FOREIGN KEY ("call_log_id") REFERENCES "public"."call_logs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_content" ADD CONSTRAINT "call_content_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_content" ADD CONSTRAINT "call_content_pipeline_project_id_pipeline_projects_id_fk" FOREIGN KEY ("pipeline_project_id") REFERENCES "public"."pipeline_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_agent_id_ai_voice_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."ai_voice_agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_zoom_meeting_id_zoom_meetings_id_fk" FOREIGN KEY ("zoom_meeting_id") REFERENCES "public"."zoom_meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_pipeline_project_id_pipeline_projects_id_fk" FOREIGN KEY ("pipeline_project_id") REFERENCES "public"."pipeline_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_voice_actions" ADD CONSTRAINT "scheduled_voice_actions_agent_id_ai_voice_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."ai_voice_agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_voice_actions" ADD CONSTRAINT "scheduled_voice_actions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_voice_actions" ADD CONSTRAINT "scheduled_voice_actions_zoom_meeting_id_zoom_meetings_id_fk" FOREIGN KEY ("zoom_meeting_id") REFERENCES "public"."zoom_meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_voice_actions" ADD CONSTRAINT "scheduled_voice_actions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zoom_meetings" ADD CONSTRAINT "zoom_meetings_host_user_id_users_id_fk" FOREIGN KEY ("host_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zoom_meetings" ADD CONSTRAINT "zoom_meetings_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;