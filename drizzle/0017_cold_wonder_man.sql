CREATE TABLE "pastoral_care" (
	"care_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"care_type" text DEFAULT 'visitation' NOT NULL,
	"care_date" date,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pastoral_care" ADD CONSTRAINT "pastoral_care_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pastoral_care" ADD CONSTRAINT "pastoral_care_member_id_member_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("member_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pastoral_care_church_idx" ON "pastoral_care" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "pastoral_care_member_idx" ON "pastoral_care" USING btree ("member_id");