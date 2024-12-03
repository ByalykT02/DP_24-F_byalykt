"use server";

import { Category, CategoryGroup, CategoryType } from "~/lib/types/category";

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
let categoriesCache: Record<number, Category[]> = {};
let lastFetchTime: Record<number, number> = {};

async function fetchCategoriesForType(typeId: number): Promise<Category[]> {
  const now = Date.now();
  
  // Return cached data if available and not expired
  if (
    categoriesCache[typeId] &&
    lastFetchTime[typeId] &&
    now - lastFetchTime[typeId] < CACHE_DURATION
  ) {
    return categoriesCache[typeId];
  }

  try {
    const response = await fetch(
      `http://www.wikiart.org/en/App/wiki/DictionariesJson/${typeId}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Update cache
    categoriesCache[typeId] = data;
    lastFetchTime[typeId] = now;
    
    return data;
  } catch (error) {
    console.error(`Error fetching categories for type ${typeId}:`, error);
    return [];
  }
}

export async function getAllCategories(): Promise<CategoryGroup[]> {
  const categoryGroups: CategoryGroup[] = [
    {
      id: CategoryType.PERIOD,
      name: "Historical Periods",
      description: "Explore art through different historical periods",
      categories: await fetchCategoriesForType(CategoryType.PERIOD),
    },
    {
      id: CategoryType.STYLE,
      name: "Art Styles",
      description: "Discover various artistic styles and movements",
      categories: await fetchCategoriesForType(CategoryType.STYLE),
    },
    {
      id: CategoryType.GENRE,
      name: "Genres & Themes",
      description: "Browse artworks by their genre and subject matter",
      categories: await fetchCategoriesForType(CategoryType.GENRE),
    },
    {
      id: CategoryType.NATIONALITY,
      name: "Artist Nationalities",
      description: "Explore art from different cultures and countries",
      categories: await fetchCategoriesForType(CategoryType.NATIONALITY),
    },
    {
      id: CategoryType.MEDIUM,
      name: "Mediums",
      description: "Art categorized by their medium of expression",
      categories: await fetchCategoriesForType(CategoryType.MEDIUM),
    },
  ];

  return categoryGroups;
}

export async function getCategoryDetails(
  typeId: number,
  categoryUrl: string
): Promise<Category | null> {
  const categories = await fetchCategoriesForType(typeId);
  return categories.find((cat) => cat.url === categoryUrl) ?? null;
}

