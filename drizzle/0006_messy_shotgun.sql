CREATE TABLE "church_storage_usage" (
	"church_id" uuid PRIMARY KEY NOT NULL,
	"bytes_used" bigint DEFAULT 0 NOT NULL,
	"file_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan" (
	"plan_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"storage_limit" bigint DEFAULT 0 NOT NULL,
	"price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plan_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"subscription_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"current_period_end" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "church_storage_usage" ADD CONSTRAINT "church_storage_usage_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_plan_id_plan_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plan"("plan_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "subscription_church_idx" ON "subscription" USING btree ("church_id");