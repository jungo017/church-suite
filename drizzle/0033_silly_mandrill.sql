CREATE TABLE "form" (
	"form_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'survey' NOT NULL,
	"period_year" integer,
	"target_role" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"anonymous" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_answer" (
	"answer_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"response_id" uuid NOT NULL,
	"field_id" uuid NOT NULL,
	"value" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_assignment" (
	"assignment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"form_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_field" (
	"field_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"form_id" uuid NOT NULL,
	"label" text NOT NULL,
	"type" text NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"options" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_response" (
	"response_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"form_id" uuid NOT NULL,
	"assignment_id" uuid,
	"member_id" uuid,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "form" ADD CONSTRAINT "form_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_answer" ADD CONSTRAINT "form_answer_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_answer" ADD CONSTRAINT "form_answer_response_id_form_response_response_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."form_response"("response_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_answer" ADD CONSTRAINT "form_answer_field_id_form_field_field_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."form_field"("field_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_assignment" ADD CONSTRAINT "form_assignment_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_assignment" ADD CONSTRAINT "form_assignment_form_id_form_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form"("form_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_assignment" ADD CONSTRAINT "form_assignment_member_id_member_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("member_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_field" ADD CONSTRAINT "form_field_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_field" ADD CONSTRAINT "form_field_form_id_form_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form"("form_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_response" ADD CONSTRAINT "form_response_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_response" ADD CONSTRAINT "form_response_form_id_form_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form"("form_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_response" ADD CONSTRAINT "form_response_assignment_id_form_assignment_assignment_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."form_assignment"("assignment_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_response" ADD CONSTRAINT "form_response_member_id_member_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("member_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "form_church_idx" ON "form" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "form_church_category_year_idx" ON "form" USING btree ("church_id","category","period_year");--> statement-breakpoint
CREATE INDEX "form_answer_response_idx" ON "form_answer" USING btree ("church_id","response_id");--> statement-breakpoint
CREATE INDEX "form_answer_field_idx" ON "form_answer" USING btree ("church_id","field_id");--> statement-breakpoint
CREATE UNIQUE INDEX "form_answer_unique" ON "form_answer" USING btree ("response_id","field_id");--> statement-breakpoint
CREATE INDEX "form_assignment_form_idx" ON "form_assignment" USING btree ("church_id","form_id");--> statement-breakpoint
CREATE INDEX "form_assignment_status_idx" ON "form_assignment" USING btree ("church_id","form_id","status");--> statement-breakpoint
CREATE INDEX "form_assignment_member_idx" ON "form_assignment" USING btree ("church_id","member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "form_assignment_unique" ON "form_assignment" USING btree ("form_id","member_id");--> statement-breakpoint
CREATE INDEX "form_field_church_idx" ON "form_field" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "form_field_form_idx" ON "form_field" USING btree ("church_id","form_id");--> statement-breakpoint
CREATE INDEX "form_response_form_idx" ON "form_response" USING btree ("church_id","form_id");--> statement-breakpoint
CREATE INDEX "form_response_assignment_idx" ON "form_response" USING btree ("church_id","assignment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "form_response_assignment_unique" ON "form_response" USING btree ("assignment_id");