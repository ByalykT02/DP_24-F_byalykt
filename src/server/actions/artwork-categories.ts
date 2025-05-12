"use server";

import { db } from "~/server/db";
import { artworks, artists } from "~/server/db/schema";
import { eq, sql, inArray, desc, asc } from "drizzle-orm";
import { logger } from "~/utils/logger";
import type { ApiResponse } from "~/lib/types/api";
import type { Artwork, ArtworkDetailed, ReferenceArtwork } from "~/lib/types/artwork";

/**
 * Represents a category with its metadata
 */
export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  count: number;
  thumbnail?: string;
}

/**
 * Types of categories available in the artwork data
 */
export type CategoryType = 'genre' | 'style' | 'period' | 'technique' | 'tag';

/**
 * Category filter options for querying artworks
 */
export interface CategoryFilters {
  genres?: string[];
  styles?: string[];
  periods?: string[];
  techniques?: string[];
  tags?: string[];
  yearRange?: [number | null, number | null];
  artistIds?: number[];
  limit?: number;
  offset?: number;
  sortBy?: 'year' | 'title' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Extract and normalize values from comma-separated string fields
 */
function extractValues(input: string | null): string[] {
  if (!input) return [];
  return input.split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

/**
 * Get all available categories of a specific type
 */
export async function getCategories(
  type: CategoryType,
  limit = 100
): Promise<ApiResponse<Category[]>> {
  const log = logger.child({
    action: "getCategories",
    type,
  });

  try {
    // Based on category type, query the appropriate column
    let query;
    
    switch (type) {
      case 'genre': {
        query = db.select({
          name: artworks.genre,
          count: sql<number>`count(*)`,
          thumbnail: sql<string>`min(${artworks.image})`, // Sample thumbnail
        })
        .from(artworks)
        .where(sql`${artworks.genre} is not null and ${artworks.genre} <> ''`)
        .groupBy(artworks.genre)
        .orderBy(desc(sql`count(*)`))
        .limit(limit);
        break;
      }
      case 'style': {
        query = db.select({
          name: artworks.style,
          count: sql<number>`count(*)`,
          thumbnail: sql<string>`min(${artworks.image})`,
        })
        .from(artworks)
        .where(sql`${artworks.style} is not null and ${artworks.style} <> ''`)
        .groupBy(artworks.style)
        .orderBy(desc(sql`count(*)`))
        .limit(limit);
        break;
      }
      case 'period': {
        query = db.select({
          name: artworks.period,
          count: sql<number>`count(*)`,
          thumbnail: sql<string>`min(${artworks.image})`,
        })
        .from(artworks)
        .where(sql`${artworks.period} is not null and ${artworks.period} <> ''`)
        .groupBy(artworks.period)
        .orderBy(desc(sql`count(*)`))
        .limit(limit);
        break;
      }
      case 'technique': {
        query = db.select({
          name: artworks.technique,
          count: sql<number>`count(*)`,
          thumbnail: sql<string>`min(${artworks.image})`,
        })
        .from(artworks)
        .where(sql`${artworks.technique} is not null and ${artworks.technique} <> ''`)
        .groupBy(artworks.technique)
        .orderBy(desc(sql`count(*)`))
        .limit(limit);
        break;
      }
      case 'tag': {
        // For tags, we need special handling since they're stored as comma-separated values
        // This is a simplified approach - in a production environment, you might want to 
        // use a more sophisticated method or store tags in a separate table
        query = db.select({
          tags: artworks.tags,
          image: artworks.image,
        })
        .from(artworks)
        .where(sql`${artworks.tags} is not null and ${artworks.tags} <> ''`)
        .limit(1000); // Get a sample of artworks with tags
        
        const results = await query;
        
        // Process the tags to get counts
        const tagCounts: Record<string, { count: number, thumbnails: string[] }> = {};
        
        for (const result of results) {
          const tags = extractValues(result.tags);
          for (const tag of tags) {
            if (!tagCounts[tag]) {
              tagCounts[tag] = { count: 0, thumbnails: [] };
            }
            tagCounts[tag].count += 1;
            if (tagCounts[tag].thumbnails.length < 5) { // Collect some sample thumbnails
              tagCounts[tag].thumbnails.push(result.image);
            }
          }
        }
        
        // Convert to Category[] format and sort
        const categories = Object.entries(tagCounts)
          .map(([name, data]) => ({
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            type: 'tag' as CategoryType,
            count: data.count,
            thumbnail: data.thumbnails[0] || undefined,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, limit);
        
        return { success: true, data: categories };
      }
    }
    
    if (!query) {
      return { success: false, error: `Invalid category type: ${type}` };
    }
    
    const results = await query;
    
    // Format results
    const categories: Category[] = results.map(result => ({
      id: result.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
      name: result.name || 'Unknown',
      type,
      count: Number(result.count),
      thumbnail: result.thumbnail,
    }));
    
    return { success: true, data: categories };
  } catch (error) {
    log.error("Failed to fetch categories", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return {
      success: false,
      error: `Failed to fetch ${type} categories`,
    };
  }
}

/**
 * Get artworks by category filters
 */
export async function getArtworksByCategory(
  filters: CategoryFilters
): Promise<ApiResponse<{ artworks: Artwork[], total: number }>> {
  const log = logger.child({
    action: "getArtworksByCategory",
    filters,
  });

  const {
    genres = [],
    styles = [],
    periods = [],
    techniques = [],
    tags = [],
    yearRange = [null, null],
    artistIds = [], 
    limit = 20,
    offset = 0,
    sortBy = 'year',
    sortOrder = 'desc'
  } = filters;

  try {
    let query = db.select({
      contentId: artworks.contentId,
      title: artworks.title,
      artistContentId: artworks.artistContentId,
      artistName: artworks.artistName,
      completitionYear: artworks.completitionYear,
      yearAsString: artworks.yearAsString,
      width: artworks.width,
      height: artworks.height,
      image: artworks.image,
    })
    .from(artworks);
    
    // Build where clause based on filters
    const conditions = [];
    
    if (genres.length > 0) {
      conditions.push(inArray(artworks.genre, genres));
    }
    
    if (styles.length > 0) {
      conditions.push(inArray(artworks.style, styles));
    }
    
    if (periods.length > 0) {
      conditions.push(inArray(artworks.period, periods));
    }
    
    if (techniques.length > 0) {
      conditions.push(inArray(artworks.technique, techniques));
    }
    
    // Handle tag filtering (simplified - this could be more sophisticated)
    if (tags.length > 0) {
      const tagConditions = tags.map(tag => 
        sql`${artworks.tags} LIKE ${`%${tag}%`}`
      );
      conditions.push(sql`(${sql.join(tagConditions, sql` OR `)})`);
    }
    
    // Year range
    const [startYear, endYear] = yearRange;
    if (startYear !== null) {
      conditions.push(sql`${artworks.completitionYear} >= ${startYear}`);
    }
    if (endYear !== null) {
      conditions.push(sql`${artworks.completitionYear} <= ${endYear}`);
    }
    
    // Artist IDs
    if (artistIds.length > 0) {
      conditions.push(inArray(artworks.artistContentId, artistIds));
    }
    
    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(sql.join(conditions, sql` AND `));
    }
    
    // Get total count for pagination
    const countQuery = db.select({
      count: sql<number>`count(*)`,
    })
    .from(artworks);
    
    if (conditions.length > 0) {
      countQuery.where(sql.join(conditions, sql` AND `));
    }
    
    const totalResult = await countQuery;
    const total = Number(totalResult[0]?.count) || 0;
    
    // Apply sorting
    if (sortBy === 'year') {
      query = query.orderBy(
        sortOrder === 'asc' 
          ? asc(artworks.completitionYear) 
          : desc(artworks.completitionYear)
      );
    } else if (sortBy === 'title') {
      query = query.orderBy(
        sortOrder === 'asc' 
          ? asc(artworks.title) 
          : desc(artworks.title)
      );
    }
    
    // Apply pagination
    query = query.limit(limit).offset(offset);
    
    const results = await query;
    
    // Format results to match Artwork interface
    const formattedResults: Artwork[] = results.map(result => ({
      contentId: result.contentId,
      title: result.title,
      artistContentId: result.artistContentId,
      artistName: result.artistName,
      completitionYear: result.completitionYear || 0,
      yearAsString: result.yearAsString || '',
      width: Number(result.width) || 0,
      height: Number(result.height) || 0,
      image: result.image,
    }));
    
    return { 
      success: true, 
      data: { 
        artworks: formattedResults,
        total
      } 
    };
  } catch (error) {
    log.error("Failed to fetch artworks by category", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return {
      success: false,
      error: "Failed to fetch artworks by category",
    };
  }
}

/**
 * Get related categories based on a reference artwork
 * This is useful for "more like this" functionality
 */
export async function getRelatedCategories(
  referenceArtworkId: number,
  limit = 5
): Promise<ApiResponse<Category[]>> {
  const log = logger.child({
    action: "getRelatedCategories",
    referenceArtworkId,
  });

  try {
    // Get the reference artwork
    const referenceArtwork = await db.query.artworks.findFirst({
      where: eq(artworks.contentId, referenceArtworkId),
      columns: {
        contentId: true,
        style: true,
        genre: true,
        period: true,
        technique: true,
        tags: true,
      },
    });
    
    if (!referenceArtwork) {
      return {
        success: false,
        error: "Reference artwork not found",
      };
    }
    
    // Extract categories from the artwork
    const categories: Category[] = [];
    
    if (referenceArtwork.style) {
      categories.push({
        id: referenceArtwork.style.toLowerCase().replace(/\s+/g, '-'),
        name: referenceArtwork.style,
        type: 'style',
        count: 0, // Will be populated below
      });
    }
    
    if (referenceArtwork.genre) {
      categories.push({
        id: referenceArtwork.genre.toLowerCase().replace(/\s+/g, '-'),
        name: referenceArtwork.genre,
        type: 'genre',
        count: 0,
      });
    }
    
    if (referenceArtwork.period) {
      categories.push({
        id: referenceArtwork.period.toLowerCase().replace(/\s+/g, '-'),
        name: referenceArtwork.period,
        type: 'period',
        count: 0,
      });
    }
    
    if (referenceArtwork.technique) {
      categories.push({
        id: referenceArtwork.technique.toLowerCase().replace(/\s+/g, '-'),
        name: referenceArtwork.technique,
        type: 'technique',
        count: 0,
      });
    }
    
    // Add some tags
    const tags = extractValues(referenceArtwork.tags);
    for (const tag of tags.slice(0, 3)) { // Take up to 3 tags
      categories.push({
        id: tag.toLowerCase().replace(/\s+/g, '-'),
        name: tag,
        type: 'tag',
        count: 0,
      });
    }
    
    // Now get counts for each category
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      let count = 0;
      
      switch (category.type) {
        case 'style':
          count = await db.select({ count: sql<number>`count(*)` })
            .from(artworks)
            .where(eq(artworks.style, category.name))
            .then(res => Number(res[0]?.count) || 0);
          break;
        case 'genre':
          count = await db.select({ count: sql<number>`count(*)` })
            .from(artworks)
            .where(eq(artworks.genre, category.name))
            .then(res => Number(res[0]?.count) || 0);
          break;
        case 'period':
          count = await db.select({ count: sql<number>`count(*)` })
            .from(artworks)
            .where(eq(artworks.period, category.name))
            .then(res => Number(res[0]?.count) || 0);
          break;
        case 'technique':
          count = await db.select({ count: sql<number>`count(*)` })
            .from(artworks)
            .where(eq(artworks.technique, category.name))
            .then(res => Number(res[0]?.count) || 0);
          break;
        case 'tag':
          count = await db.select({ count: sql<number>`count(*)` })
            .from(artworks)
            .where(sql`${artworks.tags} LIKE ${`%${category.name}%`}`)
            .then(res => Number(res[0]?.count) || 0);
          break;
      }
      
      categories[i] = {
        ...category,
        count,
      };
    }
    
    // Also get a sample thumbnail for each category
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      let thumbnail = '';
      
      switch (category.type) {
        case 'style':
          thumbnail = await db.select({ image: artworks.image })
            .from(artworks)
            .where(eq(artworks.style, category.name))
            .limit(1)
            .then(res => res[0]?.image || '');
          break;
        case 'genre':
          thumbnail = await db.select({ image: artworks.image })
            .from(artworks)
            .where(eq(artworks.genre, category.name))
            .limit(1)
            .then(res => res[0]?.image || '');
          break;
        case 'period':
          thumbnail = await db.select({ image: artworks.image })
            .from(artworks)
            .where(eq(artworks.period, category.name))
            .limit(1)
            .then(res => res[0]?.image || '');
          break;
        case 'technique':
          thumbnail = await db.select({ image: artworks.image })
            .from(artworks)
            .where(eq(artworks.technique, category.name))
            .limit(1)
            .then(res => res[0]?.image || '');
          break;
        case 'tag':
          thumbnail = await db.select({ image: artworks.image })
            .from(artworks)
            .where(sql`${artworks.tags} LIKE ${`%${category.name}%`}`)
            .limit(1)
            .then(res => res[0]?.image || '');
          break;
      }
      
      categories[i] = {
        ...category,
        thumbnail,
      };
    }
    
    // Sort by count and limit
    const sortedCategories = categories
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    return { success: true, data: sortedCategories };
  } catch (error) {
    log.error("Failed to get related categories", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return {
      success: false,
      error: "Failed to get related categories",
    };
  }
}

/**
 * Get category statistics and trends
 */
export async function getCategoryStats(): Promise<ApiResponse<{
  topGenres: Category[];
  topStyles: Category[];
  topPeriods: Category[];
  topTags: Category[];
  yearDistribution: { year: number; count: number }[];
}>> {
  const log = logger.child({
    action: "getCategoryStats",
  });
  
  try {
    // Get top categories for each type
    const [
      genresResult, 
      stylesResult, 
      periodsResult, 
      tagsResult
    ] = await Promise.all([
      getCategories('genre', 10),
      getCategories('style', 10),
      getCategories('period', 10),
      getCategories('tag', 20),
    ]);
    
    // Generate year distribution for timeline visualization
    const yearDistributionResult = await db.select({
      year: artworks.completitionYear,
      count: sql<number>`count(*)`,
    })
    .from(artworks)
    .where(sql`${artworks.completitionYear} is not null`)
    .groupBy(artworks.completitionYear)
    .orderBy(asc(artworks.completitionYear));
    
    const yearDistribution = yearDistributionResult
      .filter(y => y.year !== null)
      .map(y => ({
        year: Number(y.year),
        count: Number(y.count),
      }));
    
    return {
      success: true,
      data: {
        topGenres: genresResult.success ? genresResult.data : [],
        topStyles: stylesResult.success ? stylesResult.data : [],
        topPeriods: periodsResult.success ? periodsResult.data : [],
        topTags: tagsResult.success ? tagsResult.data : [],
        yearDistribution,
      }
    };
  } catch (error) {
    log.error("Failed to get category statistics", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return {
      success: false,
      error: "Failed to get category statistics",
    };
  }
}

/**
 * Extract categories from an artwork
 * Useful for processing and categorizing a single artwork
 */
export async function extractCategoriesFromArtwork(
  artwork: ArtworkDetailed | ReferenceArtwork
): Promise<Record<CategoryType, string[]>> {
  const categories: Record<CategoryType, string[]> = {
    genre: [],
    style: [],
    period: [],
    technique: [],
    tag: [],
  };
  
  // Extract genre
  if (artwork.genre) {
    categories.genre.push(artwork.genre);
  }
  
  // Extract style
  if (artwork.style) {
    categories.style.push(artwork.style);
  }
  
  // Extract period
  if (artwork.period) {
    categories.period.push(artwork.period);
  }
  
  // Extract technique
  if (artwork.technique) {
    categories.technique.push(artwork.technique);
  }
  
  // Extract tags
  if (artwork.tags) {
    categories.tag = extractValues(artwork.tags);
  }
  
  return categories;
}