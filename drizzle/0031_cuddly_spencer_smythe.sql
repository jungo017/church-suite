CREATE TABLE "org_role" (
	"org_role_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"is_leader" boolean DEFAULT false NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "position" (
	"position_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_membership" (
	"membership_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"org_role_id" uuid,
	"period_year" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN "position_id" uuid;--> statement-breakpoint
ALTER TABLE "org_role" ADD CONSTRAINT "org_role_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position" ADD CONSTRAINT "position_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_membership" ADD CONSTRAINT "org_membership_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_membership" ADD CONSTRAINT "org_membership_member_id_member_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("member_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_membership" ADD CONSTRAINT "org_membership_department_id_department_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("department_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_membership" ADD CONSTRAINT "org_membership_org_role_id_org_role_org_role_id_fk" FOREIGN KEY ("org_role_id") REFERENCES "public"."org_role"("org_role_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "org_role_church_idx" ON "org_role" USING btree ("church_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_role_church_code_unique" ON "org_role" USING btree ("church_id","code");--> statement-breakpoint
CREATE INDEX "position_church_idx" ON "position" USING btree ("church_id");--> statement-breakpoint
CREATE UNIQUE INDEX "position_church_code_unique" ON "position" USING btree ("church_id","code");--> statement-breakpoint
CREATE INDEX "org_membership_dept_year_idx" ON "org_membership" USING btree ("church_id","department_id","period_year");--> statement-breakpoint
CREATE INDEX "org_membership_member_year_idx" ON "org_membership" USING btree ("church_id","member_id","period_year");--> statement-breakpoint
CREATE UNIQUE INDEX "org_membership_unique" ON "org_membership" USING btree ("church_id","member_id","department_id","period_year");--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_position_id_position_position_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."position"("position_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "member_position_idx" ON "member" USING btree ("position_id");