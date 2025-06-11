ALTER TABLE "artist" ALTER COLUMN "content_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "artwork" ALTER COLUMN "content_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "artwork" ALTER COLUMN "artist_content_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "collection_item" ALTER COLUMN "artwork_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "user_interaction" ALTER COLUMN "artwork_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "viewing_history" ALTER COLUMN "artwork_id" SET DATA TYPE integer;