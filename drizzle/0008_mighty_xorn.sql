CREATE TABLE "department" (
	"department_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"parent_id" uuid,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset" (
	"asset_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"tag" text,
	"name" text NOT NULL,
	"asset_type" text DEFAULT 'equipment' NOT NULL,
	"status" text DEFAULT 'in_use' NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"category_id" uuid,
	"department_id" uuid,
	"location_id" uuid,
	"acquired_at" date,
	"acquired_cost" numeric(14, 2),
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_category" (
	"category_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"parent_id" uuid,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "location" (
	"location_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"parent_id" uuid,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "department" ADD CONSTRAINT "department_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department" ADD CONSTRAINT "department_parent_id_department_department_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."department"("department_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_category_id_asset_category_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."asset_category"("category_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_department_id_department_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("department_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_location_id_location_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("location_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_category" ADD CONSTRAINT "asset_category_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_category" ADD CONSTRAINT "asset_category_parent_id_asset_category_category_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."asset_category"("category_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location" ADD CONSTRAINT "location_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location" ADD CONSTRAINT "location_parent_id_location_location_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."location"("location_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "department_church_idx" ON "department" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "asset_church_idx" ON "asset" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "asset_category_idx" ON "asset" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "asset_department_idx" ON "asset" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "asset_location_idx" ON "asset" USING btree ("location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "asset_church_tag_unique" ON "asset" USING btree ("church_id","tag");--> statement-breakpoint
CREATE INDEX "asset_category_church_idx" ON "asset_category" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "location_church_idx" ON "location" USING btree ("church_id");