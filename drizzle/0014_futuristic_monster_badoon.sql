ALTER TABLE "member" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN "department_id" uuid;--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN "registered_date" date;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_department_id_department_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("department_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "member_department_idx" ON "member" USING btree ("department_id");