CREATE TYPE "public"."request_source" AS ENUM('direct', 'transcript');--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "source" "request_source" DEFAULT 'direct' NOT NULL;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "source_quote" text;