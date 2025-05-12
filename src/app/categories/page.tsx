import { Suspense } from 'react';
import { getCategoryStats } from '~/server/actions/artwork-categories';
import Link from 'next/link';
import Image from 'next/image';
import { Category, CategoryType } from '~/server/actions/artwork-categories';
import { ArrowRight, BarChart3, Filter, Palette } from 'lucide-react';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';

// UI Components
function CategoryItem({ category }: { category: Category }) {
  return (
    <Link
      href={`/categories/${category.type}/${category.id}`}
      className="group flex flex-col overflow-hidden rounded-lg transition-all duration-300"
    >
      <Card className="overflow-hidden border hover:shadow-md transition-all duration-300">
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-200">
          {category.thumbnail ? (
            <Image
              src={category.thumbnail}
              alt={category.name}
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              fill
              sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted">
              <Palette className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="text-lg font-medium">{category.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{category.count} artworks</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function CategorySection({ title, categories, icon, href }: {
  title: string;
  categories: Category[];
  icon?: React.ReactNode;
  href: string;
}) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        <Link href={href} className="flex items-center text-sm text-primary hover:underline">
          View all
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {categories.slice(0, 8).map((category) => (
          <CategoryItem key={`${category.type}-${category.id}`} category={category} />
        ))}
      </div>
    </section>
  );
}

function YearDistributionChart({ data }: { data: { year: number; count: number }[] }) {
  // Simplify the data for display by grouping into decades
  const decades: Record<string, number> = {};

  data.forEach(({ year, count }) => {
    if (year < 1000) return; // Filter out potentially problematic dates
    const decade = Math.floor(year / 10) * 10;
    decades[decade] = (decades[decade] || 0) + count;
  });

  // Find the max count for scaling
  const maxCount = Math.max(...Object.values(decades), 1);

  return (
    <section className="mt-12">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold">Artwork Timeline</h2>
      </div>
      <Card className="p-6">
        <div className="h-64 w-full">
          <div className="flex h-48 items-end justify-between space-x-1">
            {Object.entries(decades)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([decade, count]) => (
                <div key={decade} className="group relative flex flex-col items-center">
                  <div
                    className="w-10 bg-primary hover:bg-primary/80 transition-colors rounded-t"
                    style={{ height: `${(count / maxCount) * 100}%` }}
                  ></div>
                  <span className="mt-2 text-xs">{decade}s</span>
                  <div className="absolute bottom-full mb-2 hidden rounded bg-background border p-2 text-xs group-hover:block shadow-md">
                    <span className="font-semibold">{decade}s:</span> {count} artworks
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </Card>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="space-y-12">
        <div>
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col">
                <Skeleton className="w-full h-48 mb-3" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col">
                <Skeleton className="w-full h-48 mb-3" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>

        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="rounded-lg bg-destructive/10 p-8 text-center">
        <h2 className="text-xl font-medium text-destructive">Something went wrong</h2>
        <p className="mt-2 text-destructive/80">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          className="mt-4"
          variant="outline"
        >
          Try again
        </Button>
      </div>
    </div>
  );
}

function CategoryTypeTabs({ activeType }: { activeType?: CategoryType }) {
  const tabs: Array<{ label: string; type: CategoryType; icon: React.ReactNode }> = [
    { label: 'Genres', type: 'genre', icon: <Palette className="h-4 w-4" /> },
    { label: 'Styles', type: 'style', icon: <Palette className="h-4 w-4" /> },
    { label: 'Periods', type: 'period', icon: <Palette className="h-4 w-4" /> },
    { label: 'Techniques', type: 'technique', icon: <Palette className="h-4 w-4" /> },
    { label: 'Tags', type: 'tag', icon: <Filter className="h-4 w-4" /> },
  ];

  return (
    <div className="mt-8 border-b border-muted">
      <nav className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
        <Link
          href="/categories"
          className={`flex items-center gap-2 whitespace-nowrap pb-2 px-1 text-sm font-medium ${
            !activeType
              ? 'border-b-2 border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:border-muted hover:text-foreground'
          }`}
        >
          Overview
        </Link>
        {tabs.map((tab) => (
          <Link
            key={tab.type}
            href={`/categories/${tab.type}`}
            className={`flex items-center gap-2 whitespace-nowrap pb-2 px-1 text-sm font-medium ${
              activeType === tab.type
                ? 'border-b-2 border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-muted hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

// Main Categories component
async function CategoriesContent() {
  const response = await getCategoryStats();

  if (!response.success) {
    return <ErrorState error={response.error || "Failed to load categories"} />;
  }

  const { topGenres, topStyles, topPeriods, topTags, yearDistribution } = response.data;

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Artwork Categories</h1>
          <p className="mt-2 text-muted-foreground">
            Explore our artwork collection by different categories such as genres, styles, periods, and more.
          </p>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/artworks">
              <Palette className="mr-2 h-4 w-4" />
              All Artworks
            </Link>
          </Button>
        </div>
      </div>

      <CategoryTypeTabs />

      <CategorySection
        title="Popular Genres"
        categories={topGenres}
        icon={<Palette className="h-5 w-5 text-primary" />}
        href="/categories/genre"
      />

      <CategorySection
        title="Popular Styles"
        categories={topStyles}
        icon={<Palette className="h-5 w-5 text-primary" />}
        href="/categories/style"
      />

      <CategorySection
        title="Art Periods"
        categories={topPeriods}
        icon={<Palette className="h-5 w-5 text-primary" />}
        href="/categories/period"
      />

      <CategorySection
        title="Common Tags"
        categories={topTags}
        icon={<Filter className="h-5 w-5 text-primary" />}
        href="/categories/tag"
      />

      <YearDistributionChart data={yearDistribution} />
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CategoriesContent />
    </Suspense>
  );
}
