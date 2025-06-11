DO $$ BEGIN
 CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'USER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account" (
	"user_id" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "account_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "artist" (
	"content_id" integer PRIMARY KEY NOT NULL,
	"artist_name" varchar(255) NOT NULL,
	"url" varchar(255) NOT NULL,
	"last_name_first" varchar(255),
	"birth_day" date,
	"death_day" date,
	"birth_day_string" varchar(100),
	"death_day_string" varchar(100),
	"original_artist_name" varchar(255),
	"gender" varchar(50),
	"biography" text,
	"story" text,
	"active_years_start" varchar(50),
	"active_years_completion" varchar(50),
	"series" text,
	"themes" text,
	"periods_of_work" text,
	"image" varchar(1000),
	"wikipedia_url" varchar(1000),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	"dictionaries" json
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "artwork" (
	"content_id" bigint PRIMARY KEY NOT NULL,
	"artist_content_id" integer NOT NULL,
	"artist_name" varchar(255) NOT NULL,
	"artist_url" varchar(255),
	"title" varchar(255) NOT NULL,
	"url" varchar(255),
	"completition_year" integer,
	"year_as_string" varchar(50),
	"genre" varchar(100),
	"style" varchar(100),
	"tags" text,
	"dictionaries" json,
	"width" numeric(6, 2),
	"height" numeric(6, 2),
	"material" varchar(255),
	"technique" varchar(255),
	"location" varchar(255),
	"period" varchar(100),
	"serie" varchar(255),
	"gallery_name" varchar(255),
	"image" varchar(1000) NOT NULL,
	"auction" text,
	"year_of_trade" integer,
	"last_price" numeric(10, 2),
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "collection_item" (
	"id" serial PRIMARY KEY NOT NULL,
	"collection_id" integer NOT NULL,
	"artwork_id" bigint NOT NULL,
	"added_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"session_token" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_collection" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_interaction" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"artwork_id" bigint NOT NULL,
	"rating" integer,
	"comment" text,
	"is_favorite" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"preferred_styles" json,
	"preferred_periods" json,
	"newsletter_subscription" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"email_verified" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"image" varchar(255),
	"password" varchar(255),
	"role" "user_role" DEFAULT 'USER' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification_token" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "viewing_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"artwork_id" bigint NOT NULL,
	"viewed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "artwork" ADD CONSTRAINT "artwork_artist_content_id_artist_content_id_fk" FOREIGN KEY ("artist_content_id") REFERENCES "public"."artist"("content_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "collection_item" ADD CONSTRAINT "collection_item_collection_id_user_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."user_collection"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "collection_item" ADD CONSTRAINT "collection_item_artwork_id_artwork_content_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artwork"("content_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_collection" ADD CONSTRAINT "user_collection_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_interaction" ADD CONSTRAINT "user_interaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_interaction" ADD CONSTRAINT "user_interaction_artwork_id_artwork_content_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artwork"("content_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "viewing_history" ADD CONSTRAINT "viewing_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "viewing_history" ADD CONSTRAINT "viewing_history_artwork_id_artwork_content_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artwork"("content_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "session" USING btree ("user_id");