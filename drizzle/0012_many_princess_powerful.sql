CREATE TABLE "asset_audit" (
	"audit_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_audit_item" (
	"item_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"audit_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"checked" boolean DEFAULT false NOT NULL,
	"checked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "asset_audit" ADD CONSTRAINT "asset_audit_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_audit_item" ADD CONSTRAINT "asset_audit_item_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_audit_item" ADD CONSTRAINT "asset_audit_item_audit_id_asset_audit_audit_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."asset_audit"("audit_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_audit_item" ADD CONSTRAINT "asset_audit_item_asset_id_asset_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("asset_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "asset_audit_church_idx" ON "asset_audit" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "asset_audit_item_church_idx" ON "asset_audit_item" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "asset_audit_item_audit_idx" ON "asset_audit_item" USING btree ("audit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "asset_audit_item_unique" ON "asset_audit_item" USING btree ("audit_id","asset_id");