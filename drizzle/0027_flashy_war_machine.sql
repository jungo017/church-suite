CREATE TABLE "notification" (
	"notification_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"member_id" uuid,
	"recipient" text,
	"recipient_name" text,
	"channel" text DEFAULT 'sms' NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_member_id_member_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("member_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notification_church_idx" ON "notification" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "notification_member_idx" ON "notification" USING btree ("member_id");