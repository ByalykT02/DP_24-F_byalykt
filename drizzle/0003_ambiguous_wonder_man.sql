ALTER TABLE "account" DROP CONSTRAINT "account_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "artwork" DROP CONSTRAINT "artwork_artist_content_id_artist_content_id_fk";
--> statement-breakpoint
ALTER TABLE "collection_item" DROP CONSTRAINT "collection_item_collection_id_user_collection_id_fk";
--> statement-breakpoint
ALTER TABLE "collection_item" DROP CONSTRAINT "collection_item_artwork_id_artwork_content_id_fk";
--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "session_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "user_collection" DROP CONSTRAINT "user_collection_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "user_interaction" DROP CONSTRAINT "user_interaction_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "user_interaction" DROP CONSTRAINT "user_interaction_artwork_id_artwork_content_id_fk";
--> statement-breakpoint
ALTER TABLE "user_preferences" DROP CONSTRAINT "user_preferences_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "viewing_history" DROP CONSTRAINT "viewing_history_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "viewing_history" DROP CONSTRAINT "viewing_history_artwork_id_artwork_content_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "artwork" ADD CONSTRAINT "artwork_artist_content_id_artist_content_id_fk" FOREIGN KEY ("artist_content_id") REFERENCES "public"."artist"("content_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "collection_item" ADD CONSTRAINT "collection_item_collection_id_user_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."user_collection"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "collection_item" ADD CONSTRAINT "collection_item_artwork_id_artwork_content_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artwork"("content_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_collection" ADD CONSTRAINT "user_collection_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_interaction" ADD CONSTRAINT "user_interaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_interaction" ADD CONSTRAINT "user_interaction_artwork_id_artwork_content_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artwork"("content_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "viewing_history" ADD CONSTRAINT "viewing_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "viewing_history" ADD CONSTRAINT "viewing_history_artwork_id_artwork_content_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artwork"("content_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
