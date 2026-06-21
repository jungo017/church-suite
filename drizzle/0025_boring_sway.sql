CREATE TABLE "newfamily_req" (
	"req_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"address" text,
	"message" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"member_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "online_offering" (
	"offering_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"member_id" uuid,
	"donor_name" text,
	"donor_phone" text,
	"offering_kind" text,
	"amount" numeric(14, 2) NOT NULL,
	"method" text,
	"pg_ref" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"voucher_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "newfamily_req" ADD CONSTRAINT "newfamily_req_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newfamily_req" ADD CONSTRAINT "newfamily_req_member_id_member_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("member_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "online_offering" ADD CONSTRAINT "online_offering_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "online_offering" ADD CONSTRAINT "online_offering_member_id_member_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("member_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "newfamily_req_church_idx" ON "newfamily_req" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "online_offering_church_idx" ON "online_offering" USING btree ("church_id");