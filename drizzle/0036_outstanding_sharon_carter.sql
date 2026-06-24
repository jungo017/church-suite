CREATE TABLE "platform_user" (
	"platform_user_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"login_id" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "platform_user_login_unique" ON "platform_user" USING btree ("login_id");--> statement-breakpoint
CREATE INDEX "platform_user_role_idx" ON "platform_user" USING btree ("role");