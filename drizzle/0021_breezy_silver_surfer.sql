CREATE TABLE "account" (
	"account_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'income' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voucher" (
	"voucher_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"voucher_date" date NOT NULL,
	"type" text NOT NULL,
	"account_id" uuid NOT NULL,
	"member_id" uuid,
	"amount" numeric(14, 2) NOT NULL,
	"method" text,
	"summary" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voucher" ADD CONSTRAINT "voucher_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voucher" ADD CONSTRAINT "voucher_account_id_account_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("account_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voucher" ADD CONSTRAINT "voucher_member_id_member_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("member_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_church_idx" ON "account" USING btree ("church_id");--> statement-breakpoint
CREATE UNIQUE INDEX "account_church_code_unique" ON "account" USING btree ("church_id","code");--> statement-breakpoint
CREATE INDEX "voucher_church_idx" ON "voucher" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "voucher_date_idx" ON "voucher" USING btree ("voucher_date");--> statement-breakpoint
CREATE INDEX "voucher_account_idx" ON "voucher" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "voucher_member_idx" ON "voucher" USING btree ("member_id");