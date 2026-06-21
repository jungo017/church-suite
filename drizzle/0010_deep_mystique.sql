CREATE TABLE "asset_repair" (
	"repair_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"repaired_at" date,
	"description" text NOT NULL,
	"cost" numeric(14, 2),
	"vendor" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "asset_repair" ADD CONSTRAINT "asset_repair_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_repair" ADD CONSTRAINT "asset_repair_asset_id_asset_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("asset_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "asset_repair_church_idx" ON "asset_repair" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "asset_repair_asset_idx" ON "asset_repair" USING btree ("asset_id");