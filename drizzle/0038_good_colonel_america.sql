CREATE TABLE "member_claim" (
	"claim_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"redeemed_at" timestamp with time zone,
	"redeemed_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "member_claim_tokenHash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "user_identity" (
	"identity_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_user_id" text NOT NULL,
	"email" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_user" ALTER COLUMN "login_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "app_user" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "member_claim" ADD CONSTRAINT "member_claim_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_claim" ADD CONSTRAINT "member_claim_member_id_member_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("member_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_claim" ADD CONSTRAINT "member_claim_redeemed_user_id_app_user_user_id_fk" FOREIGN KEY ("redeemed_user_id") REFERENCES "public"."app_user"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_identity" ADD CONSTRAINT "user_identity_church_id_church_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."church"("church_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_identity" ADD CONSTRAINT "user_identity_user_id_app_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "member_claim_church_idx" ON "member_claim" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "member_claim_member_idx" ON "member_claim" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_identity_provider_unique" ON "user_identity" USING btree ("church_id","provider","provider_user_id");--> statement-breakpoint
CREATE INDEX "user_identity_church_idx" ON "user_identity" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "user_identity_user_idx" ON "user_identity" USING btree ("user_id");