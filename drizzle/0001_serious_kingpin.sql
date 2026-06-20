CREATE TABLE "family" (
	"family_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"head_member_id" uuid,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"member_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"family_id" uuid,
	"name" text NOT NULL,
	"birth" date,
	"phone" text,
	"position" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_user" (
	"user_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"member_id" uuid,
	"login_id" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role" (
	"role_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_role" (
	"church_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_role_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
ALTER TABLE "family" ADD CONSTRAINT "family_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family" ADD CONSTRAINT "family_head_member_id_member_member_id_fk" FOREIGN KEY ("head_member_id") REFERENCES "public"."member"("member_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_family_id_family_family_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."family"("family_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_user" ADD CONSTRAINT "app_user_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_user" ADD CONSTRAINT "app_user_member_id_member_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("member_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role" ADD CONSTRAINT "role_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_app_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_role_id_role_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."role"("role_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "family_church_idx" ON "family" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "member_church_idx" ON "member" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "member_family_idx" ON "member" USING btree ("family_id");--> statement-breakpoint
CREATE UNIQUE INDEX "app_user_church_login_unique" ON "app_user" USING btree ("church_id","login_id");--> statement-breakpoint
CREATE INDEX "app_user_church_idx" ON "app_user" USING btree ("church_id");--> statement-breakpoint
CREATE UNIQUE INDEX "role_church_name_unique" ON "role" USING btree ("church_id","name");--> statement-breakpoint
CREATE INDEX "role_church_idx" ON "role" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "user_role_church_idx" ON "user_role" USING btree ("church_id");