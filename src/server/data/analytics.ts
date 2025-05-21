import { db } from "~/server/db";
import { users, artworks, artists, viewingHistory, userInteractions, userCollections } from "~/server/db/schema";
import { count, sql, avg, asc, gte, eq } from "drizzle-orm";
import { subDays, format } from "date-fns";

export interface UserRoleDistribution {
  ADMIN: number;
  USER: number;
}

export async function getTotalUsers() {
  const result = await db.select({
    count: count(users.id),
  }).from(users);
  return result[0]?.count || 0;
}

export async function getNewUsersCount(days: number = 30) {
  const thirtyDaysAgo = subDays(new Date(), days);
  const result = await db.select({
    count: count(users.id),
  }).from(users).where(gte(users.emailVerified, thirtyDaysAgo)); // Changed to emailVerified
  return result[0]?.count || 0;
}

export async function getUserRoleDistribution(): Promise<UserRoleDistribution> {
  const result = await db.select({
    role: users.role,
    count: count(users.id),
  }).from(users).groupBy(users.role);

  const distribution: UserRoleDistribution = result.reduce((acc, row) => {
    acc[row.role] = row.count;
    return acc;
  }, { ADMIN: 0, USER: 0 } as UserRoleDistribution);

  return distribution;
}

export async function getTotalArtworks() {
  const result = await db.select({
    count: count(artworks.contentId),
  }).from(artworks);
  return result[0]?.count || 0;
}

export async function getTotalArtists() {
  const result = await db.select({
    count: count(artists.contentId),
  }).from(artists);
  return result[0]?.count || 0;
}

export async function getNewContentCount(days: number = 30) {
  const thirtyDaysAgo = subDays(new Date(), days);

  const newArtworks = await db.select({
    count: count(artworks.contentId),
  }).from(artworks).where(gte(artworks.createdAt, thirtyDaysAgo));

  const newArtists = await db.select({
    count: count(artists.contentId),
  }).from(artists).where(gte(artists.createdAt, thirtyDaysAgo));

  return {
    newArtworks: newArtworks[0]?.count || 0,
    newArtists: newArtists[0]?.count || 0,
  };
}

export async function getTotalViewingHistoryEntries() {
  const result = await db.select({
    count: count(viewingHistory.id),
  }).from(viewingHistory);
  return result[0]?.count || 0;
}

export async function getTotalUserCollections() {
  const result = await db.select({
    count: count(userCollections.id),
  }).from(userCollections);
  return result[0]?.count || 0;
}

export async function getTotalFavoriteArtworks() {
  const result = await db.select({
    count: count(userInteractions.id),
  }).from(userInteractions).where(eq(userInteractions.isFavorite, true));
  return result[0]?.count || 0;
}

export async function getAverageArtworkRating() {
  const result = await db.select({
    avgRating: avg(userInteractions.rating),
  }).from(userInteractions).where(userInteractions.rating.isNotNull());
  return parseFloat(result[0]?.avgRating || '0').toFixed(2);
}

export async function getUserRegistrationsOverTime(timeframe: 'month' | 'week' | 'day' = 'month') {
  let orderByField: string;
  let dateField: any;

  if (timeframe === 'month') {
    orderByField = 'month';
    dateField = sql`to_char(${users.emailVerified}, 'YYYY-MM')`; // Changed to emailVerified
  } else if (timeframe === 'week') {
    orderByField = 'week';
    dateField = sql`to_char(${users.emailVerified}, 'YYYY-IW')`; // Changed to emailVerified
  } else {
    orderByField = 'day';
    dateField = sql`to_char(${users.emailVerified}, 'YYYY-MM-DD')`; // Changed to emailVerified
  }

  const result = await db.select({
    period: dateField.as(orderByField),
    count: count(users.id),
  })
  .from(users)
  .groupBy(dateField)
  .orderBy(asc(dateField));

  return result;
}

export async function getArtworkViewsOverTime(timeframe: 'month' | 'week' | 'day' = 'day', limitDays: number = 90) {
    const startDate = subDays(new Date(), limitDays);
    let orderByField: string;
    let dateField: any;

    if (timeframe === 'month') {
        orderByField = 'month';
        dateField = sql`to_char(${viewingHistory.viewedAt}, 'YYYY-MM')`;
    } else if (timeframe === 'week') {
        orderByField = 'week';
        dateField = sql`to_char(${viewingHistory.viewedAt}, 'YYYY-IW')`;
    } else {
        orderByField = 'day';
        dateField = sql`to_char(${viewingHistory.viewedAt}, 'YYYY-MM-DD')`;
    }

    const result = await db.select({
        period: dateField.as(orderByField),
        count: count(viewingHistory.id),
    })
    .from(viewingHistory)
    .where(gte(viewingHistory.viewedAt, startDate))
    .groupBy(dateField)
    .orderBy(asc(dateField));

    return result;
}
