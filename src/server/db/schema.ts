import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTableCreator,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
  boolean,
  date,
  decimal,
  json,
  pgEnum,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

export const createTable = pgTableCreator((name) => `${name}`);

export const userRoleEnum = pgEnum("user_role", ["ADMIN", "USER"]);

export const users = createTable("user", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: timestamp("email_verified", {
    mode: "date",
    withTimezone: true,
  }).default(sql`CURRENT_TIMESTAMP`),
  image: varchar("image", { length: 255 }),
  password: varchar("password", { length: 255 }),
  role: userRoleEnum("role").notNull().default("USER"),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export const accounts = createTable(
  "account",
  {
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    type: varchar("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_user_id_idx").on(account.userId),
  }),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  {
    sessionToken: varchar("session_token", { length: 255 })
      .notNull()
      .primaryKey(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (session) => ({
    userIdIdx: index("session_user_id_idx").on(session.userId),
  }),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

export const artists = createTable("artist", {
  contentId: integer("content_id").primaryKey(),
  artistName: varchar("artist_name", { length: 255 }).notNull(),
  url: varchar("url", { length: 255 }),
  lastNameFirst: varchar("last_name_first", { length: 255 }),
  birthDay: date("birth_day"),
  deathDay: date("death_day"),
  birthDayAsString: varchar("birth_day_string", { length: 100 }),
  deathDayAsString: varchar("death_day_string", { length: 100 }),
  originalArtistName: varchar("original_artist_name", { length: 255 }),
  gender: varchar("gender", { length: 50 }),
  biography: text("biography"),
  story: text("story"),
  activeYearsStart: varchar("active_years_start", { length: 50 }),
  activeYearsCompletion: varchar("active_years_completion", { length: 50 }),
  series: text("series"),
  themes: text("themes"),
  periodsOfWork: text("periods_of_work"),
  image: varchar("image", { length: 1000 }),
  wikipediaUrl: varchar("wikipedia_url", { length: 1000 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Artworks table
export const artworks = createTable("artwork", {
  contentId: integer("content_id").primaryKey(),
  artistContentId: integer("artist_content_id")
    .notNull()
    .references(() => artists.contentId),
  artistName: varchar("artist_name", { length: 255 }),
  title: varchar("title", { length: 255 }).notNull(),
  url: varchar("url", { length: 255 }),
  completitionYear: integer("completition_year"),
  yearAsString: varchar("year_as_string", { length: 50 }),
  genre: varchar("genre", { length: 100 }),
  style: varchar("style", { length: 100 }),
  tags: text("tags"),
  dictionaries: json("dictionaries"),
  width: decimal("width", { precision: 6, scale: 2 }),
  height: decimal("height", { precision: 6, scale: 2 }),
  diameter: decimal("diameter", { precision: 6, scale: 2 }),
  material: varchar("material", { length: 255 }),
  technique: varchar("technique", { length: 255 }),
  location: varchar("location", { length: 255 }),
  period: varchar("period", { length: 100 }),
  serie: varchar("serie", { length: 255 }),
  galleryName: varchar("gallery_name", { length: 255 }),
  image: varchar("image", { length: 1000 }),
  auction: text("auction"),
  yearOfTrade: integer("year_of_trade"),
  lastPrice: decimal("last_price", { precision: 10, scale: 2 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

// User Preferences and Collections
export const userPreferences = createTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  preferredStyles: json("preferred_styles").$type<string[]>(),
  preferredPeriods: json("preferred_periods").$type<string[]>(),
  newsletterSubscription: boolean("newsletter_subscription").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// User Collections
export const userCollections = createTable("user_collection", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

//History
export const viewingHistory = createTable("viewing_history", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  artworkId: integer("artwork_id")
    .notNull()
    .references(() => artworks.contentId),
  viewedAt: timestamp("viewed_at").defaultNow(),
});

// Collection Items
export const collectionItems = createTable("collection_item", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id")
    .notNull()
    .references(() => userCollections.id),
  artworkId: integer("artwork_id")
    .notNull()
    .references(() => artworks.contentId),
  addedAt: timestamp("added_at").defaultNow(),
});

// User Interactions
export const userInteractions = createTable("user_interaction", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  artworkId: integer("artwork_id")
    .notNull()
    .references(() => artworks.contentId),
  rating: integer("rating"),
  comment: text("comment"),
  isFavorite: boolean("is_favorite").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Relations
export const artistRelations = relations(artists, ({ many }) => ({
  artworks: many(artworks),
}));

export const artworkRelations = relations(artworks, ({ one }) => ({
  artist: one(artists, {
    fields: [artworks.artistContentId],
    references: [artists.contentId],
  }),
}));

export const userCollectionRelations = relations(
  userCollections,
  ({ many }) => ({
    items: many(collectionItems),
  }),
);

export const collectionItemRelations = relations(
  collectionItems,
  ({ one }) => ({
    collection: one(userCollections, {
      fields: [collectionItems.collectionId],
      references: [userCollections.id],
    }),
    artwork: one(artworks, {
      fields: [collectionItems.artworkId],
      references: [artworks.contentId],
    }),
  }),
);

export const viewingHistoryRelations = relations(viewingHistory, ({ one }) => ({
  user: one(users, {
    fields: [viewingHistory.userId],
    references: [users.id],
  }),
  artwork: one(artworks, {
    fields: [viewingHistory.artworkId],
    references: [artworks.contentId],
  }),
}));
