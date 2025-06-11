import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  getCategories,
  getArtworksByCategory,
  type CategoryType,
  type CategoryFilters
} from '~/server/actions/user_features/artwork-categories';
import type { Artwork } from '~/lib/types/artwork';
import SortingOptions from '~/components/SortingOptions';

// Pagination controls
function Pagination({
  currentPage,
  totalPages,
  baseUrl
}: {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}) {
  const pages = [];
  const maxPages = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
  let endPage = Math.min(totalPages, startPage + maxPages - 1);

  if (endPage - startPage + 1 < maxPages) {
    startPage = Math.max(1, endPage - maxPages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      {currentPage > 1 && (
        <Link
          href={`${baseUrl}?page=${currentPage - 1}`}
          className="px-3 py-1 border rounded-md hover:bg-gray-100"
        >
          &laquo; Prev
        </Link>
      )}

      {startPage > 1 && (
        <Link
          href={`${baseUrl}?page=1`}
          className="px-3 py-1 border rounded-md hover:bg-gray-100"
        >
          1
        </Link>
      )}

      {startPage > 2 && (
        <span className="px-3 py-1">...</span>
      )}

      {pages.map((page) => (
        <Link
          key={page}
          href={`${baseUrl}?page=${page}`}
          className={`px-3 py-1 border rounded-md ${
            page === currentPage
              ? 'bg-blue-500 text-white'
              : 'hover:bg-gray-100'
          }`}
        >
          {page}
        </Link>
      ))}

      {endPage < totalPages - 1 && (
        <span className="px-3 py-1">...</span>
      )}

      {endPage < totalPages && (
        <Link
          href={`${baseUrl}?page=${totalPages}`}
          className="px-3 py-1 border rounded-md hover:bg-gray-100"
        >
          {totalPages}
        </Link>
      )}

      {currentPage < totalPages && (
        <Link
          href={`${baseUrl}?page=${currentPage + 1}`}
          className="px-3 py-1 border rounded-md hover:bg-gray-100"
        >
          Next &raquo;
        </Link>
      )}
    </div>
  );
}

// Artwork grid item
function ArtworkItem({ artwork }: { artwork: Artwork }) {
  return (
    <Link
      href={`/artworks/${artwork.contentId}`}
      className="group block"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg shadow-md transition-all duration-300 group-hover:shadow-lg">
        <Image
          src={artwork.image}
          alt={artwork.title}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </div>
      <div className="mt-2">
        <h3 className="font-medium text-sm sm:text-base truncate">{artwork.title}</h3>
        <p className="text-gray-600 text-xs sm:text-sm">{artwork.artistName}</p>
        <p className="text-gray-500 text-xs">
          {artwork.yearAsString || artwork.completitionYear || 'Unknown date'}
        </p>
      </div>
    </Link>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
        <p className="mt-4 text-gray-700">Loading artworks...</p>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="rounded-lg bg-red-50 p-8 text-center">
        <h2 className="text-xl font-medium text-red-800">Something went wrong</h2>
        <p className="mt-2 text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}



// Helper function to convert category ID to a display name
function getDisplayNameFromId(id: string): string {
  return id.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

// Helper function to get human-readable category type
function getCategoryTypeLabel(type: CategoryType): string {
  const labels: Record<CategoryType, string> = {
    'genre': 'Genre',
    'style': 'Style',
    'period': 'Period',
    'technique': 'Technique',
    'tag': 'Tag',
  };

  return labels[type] || 'Category';
}

// Main component to display artworks from a category
async function CategoryArtworksContent({
  type,
  id,
  page = 1,
  sort = 'year',
  order = 'desc'
}: {
  type: CategoryType;
  id: string;
  page: number;
  sort: string;
  order: string;
}) {
  // First, get all categories of this type to find a match
  const categoriesResponse = await getCategories(type, 500);

  if (!categoriesResponse.success) {
    return <ErrorState error={categoriesResponse.error || `Failed to load ${type} categories`} />;
  }

  // Find the exact category that matches our ID
  const exactCategory = categoriesResponse.data?.find(cat => cat.id === id);

  // If we can't find the exact match, try a fuzzy match
  const fuzzyCategory = !exactCategory
    ? categoriesResponse.data?.find(cat => {
        const catId = cat.name.toLowerCase().replace(/\s+/g, '-');
        return catId === id || id.includes(catId) || catId.includes(id);
      })
    : null;

  // For display in the UI
  const displayName = getDisplayNameFromId(id);

  // Items per page
  const perPage = 24;
  const offset = (page - 1) * perPage;

  // Build the filters based on which category we found
  const filters: CategoryFilters = {
    limit: perPage,
    offset,
    sortBy: (sort === 'year' || sort === 'title') ? sort : 'year',
    sortOrder: (order === 'asc' || order === 'desc') ? order : 'desc'
  };

  if (exactCategory) {
    // If we found an exact match, use its name
    const categoryName = exactCategory.name;

    switch (type) {
      case 'genre':
        filters.genres = [categoryName];
        break;
      case 'style':
        filters.styles = [categoryName];
        break;
      case 'period':
        filters.periods = [categoryName];
        break;
      case 'technique':
        filters.techniques = [categoryName];
        break;
      case 'tag':
        filters.tags = [categoryName];
        break;
    }
  } else if (fuzzyCategory) {
    // If we found a fuzzy match, use its name
    const categoryName = fuzzyCategory.name;

    switch (type) {
      case 'genre':
        filters.genres = [categoryName];
        break;
      case 'style':
        filters.styles = [categoryName];
        break;
      case 'period':
        filters.periods = [categoryName];
        break;
      case 'technique':
        filters.techniques = [categoryName];
        break;
      case 'tag':
        filters.tags = [categoryName];
        break;
    }
  } else {
    // If we couldn't find a match, try with the display name and variations
    const categoryName = displayName;

    switch (type) {
      case 'genre':
        filters.genres = [
          categoryName,
          categoryName.toLowerCase(),
          categoryName.toUpperCase(),
          categoryName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
        ];
        break;
      case 'style':
        filters.styles = [
          categoryName,
          categoryName.toLowerCase(),
          categoryName.toUpperCase(),
          categoryName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
        ];
        break;
      case 'period':
        filters.periods = [
          categoryName,
          categoryName.toLowerCase(),
          categoryName.toUpperCase(),
          categoryName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
        ];
        break;
      case 'technique':
        filters.techniques = [
          categoryName,
          categoryName.toLowerCase(),
          categoryName.toUpperCase(),
          categoryName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
        ];
        break;
      case 'tag':
        filters.tags = [
          categoryName,
          categoryName.toLowerCase(),
          categoryName.toUpperCase()
        ];
        break;
    }
  }

  // Fetch artworks with our filters
  const response = await getArtworksByCategory(filters);

  if (!response.success) {
    return <ErrorState error={response.error || "Failed to load artworks"} />;
  }

  const { artworks, total } = response.data!;
  const totalPages = Math.ceil(total / perPage);
  const baseUrl = `/categories/${type}/${id}`;

  // If no artworks found
  if (artworks.length === 0 && page === 1) {
    return (
      <div className="mt-8 text-center py-12 bg-gray-50 rounded-lg">
        <h3 className="text-lg text-gray-600">No artworks found</h3>
        <p className="mt-2 text-gray-500">We couldn't find any artworks in this category.</p>
        <p className="mt-2 text-sm text-gray-500">
          {exactCategory
            ? `We searched for exact match "${exactCategory.name}"`
            : fuzzyCategory
              ? `We tried with similar match "${fuzzyCategory.name}"`
              : `We tried with variations of "${displayName}"`}
        </p>
        <Link
          href="/categories"
          className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Browse other categories
        </Link>
      </div>
    );
  }

  // If requested page is beyond available pages
  if (page > totalPages && totalPages > 0) {
    return (
      <div className="mt-8 text-center py-12 bg-gray-50 rounded-lg">
        <h3 className="text-lg text-gray-600">Page not found</h3>
        <p className="mt-2 text-gray-500">
          This category only has {totalPages} page{totalPages !== 1 ? 's' : ''}.
        </p>
        <Link
          href={`${baseUrl}?page=1`}
          className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Go to first page
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">
            Showing {offset + 1}-{Math.min(offset + perPage, total)} of {total} artworks
          </p>
        </div>

        <SortingOptions
          currentSort={sort}
          currentOrder={order}
          baseUrl={baseUrl}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
        {artworks.map((artwork) => (
          <ArtworkItem key={artwork.contentId} artwork={artwork} />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          baseUrl={baseUrl}
        />
      )}
    </div>
  );
}

export default function CategoryArtworksPage({
  params,
  searchParams
}: {
  params: {
    type: string;
    id: string;
  };
  searchParams: {
    page?: string;
    sort?: string;
    order?: string;
  }
}) {
  const type = params.type as CategoryType;
  const id = params.id;
  const page = Number(searchParams.page) || 1;
  const sort = searchParams.sort || 'year';
  const order = searchParams.order || 'desc';

  // Validate category type
  const isValidType = ['genre', 'style', 'period', 'technique', 'tag'].includes(type);

  if (!isValidType) {
    return notFound();
  }

  const displayName = getDisplayNameFromId(id);
  const typeLabel = getCategoryTypeLabel(type as CategoryType);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Link href="/categories" className="hover:text-gray-700">
            Categories
          </Link>
          <span className="mx-2">&gt;</span>
          <Link href={`/categories/${type}`} className="hover:text-gray-700">
            {getCategoryTypeLabel(type as CategoryType)}s
          </Link>
          <span className="mx-2">&gt;</span>
          <span className="text-gray-700">{displayName}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold">
          {displayName} <span className="text-gray-500">({typeLabel})</span>
        </h1>

        <p className="mt-2 text-gray-600">
          Browse artworks categorized as {typeLabel.toLowerCase()} "{displayName}".
        </p>
      </div>

      <Suspense fallback={<LoadingState />}>
        <CategoryArtworksContent
          type={type as CategoryType}
          id={id}
          page={page}
          sort={sort}
          order={order}
        />
      </Suspense>
    </div>
  );
}
