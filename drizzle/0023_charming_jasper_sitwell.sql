CREATE TABLE "board" (
	"board_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'general' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page" (
	"page_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post" (
	"post_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"board_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site" (
	"site_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"title" text DEFAULT '교회 홈페이지' NOT NULL,
	"theme" text DEFAULT 'default' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "board" ADD CONSTRAINT "board_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page" ADD CONSTRAINT "page_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_board_id_board_board_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."board"("board_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site" ADD CONSTRAINT "site_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "board_church_idx" ON "board" USING btree ("church_id");--> statement-breakpoint
CREATE UNIQUE INDEX "board_church_slug_unique" ON "board" USING btree ("church_id","slug");--> statement-breakpoint
CREATE INDEX "page_church_idx" ON "page" USING btree ("church_id");--> statement-breakpoint
CREATE UNIQUE INDEX "page_church_slug_unique" ON "page" USING btree ("church_id","slug");--> statement-breakpoint
CREATE INDEX "post_church_idx" ON "post" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "post_board_idx" ON "post" USING btree ("board_id");--> statement-breakpoint
CREATE INDEX "post_published_idx" ON "post" USING btree ("published");--> statement-breakpoint
CREATE UNIQUE INDEX "site_church_unique" ON "site" USING btree ("church_id");