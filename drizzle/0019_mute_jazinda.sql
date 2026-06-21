CREATE TABLE "education_enrollment" (
	"enrollment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"program_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"status" text DEFAULT 'enrolled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "education_program" (
	"program_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"start_date" date,
	"end_date" date,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "education_enrollment" ADD CONSTRAINT "education_enrollment_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "education_enrollment" ADD CONSTRAINT "education_enrollment_program_id_education_program_program_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."education_program"("program_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "education_enrollment" ADD CONSTRAINT "education_enrollment_member_id_member_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("member_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "education_program" ADD CONSTRAINT "education_program_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "education_enrollment_church_idx" ON "education_enrollment" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "education_enrollment_program_idx" ON "education_enrollment" USING btree ("program_id");--> statement-breakpoint
CREATE UNIQUE INDEX "education_enrollment_unique" ON "education_enrollment" USING btree ("program_id","member_id");--> statement-breakpoint
CREATE INDEX "education_program_church_idx" ON "education_program" USING btree ("church_id");