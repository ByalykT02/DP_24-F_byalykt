import { Suspense } from 'react';
import { getCategories, type CategoryType } from '~/server/actions/user_features/artwork-categories';
import Link from 'next/link';
import Image from 'next/image';
import { Category } from '~/server/actions/user_features/artwork-categories';
import { notFound } from 'next/navigation';
import { ChevronRight, Filter, Palette, Layers, Clock, ArrowRight, Search } from 'lucide-react';
import { Skeleton } from '~/components/ui/skeleton';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Separator } from '~/components/ui/separator';
import { Input } from '~/components/ui/input';

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

function CategoryGrid({ categories }: { categories: Category[] }) {
  if (categories.length === 0) {
    return (
      <div className="mt-8 text-center py-12 bg-muted/50 rounded-lg">
        <h3 className="text-lg text-muted-foreground">No categories found</h3>
        <p className="mt-2 text-muted-foreground">Try a different category type or check back later.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {categories.map((category) => (
        <CategoryItem key={`${category.type}-${category.id}`} category={category} />
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="mt-8 border-b border-muted mb-8">
        <nav className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24" />
          ))}
        </nav>
      </div>

      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-60" />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array(12).fill(0).map((_, i) => (
          <div key={i} className="flex flex-col">
            <Skeleton className="w-full h-48 mb-3" />
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
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

function CategoryTypeTabs({ activeType }: { activeType: CategoryType }) {
  const tabs: Array<{ label: string; type: CategoryType; icon: React.ReactNode }> = [
    { label: 'Genres', type: 'genre', icon: <Palette className="h-4 w-4" /> },
    { label: 'Styles', type: 'style', icon: <Layers className="h-4 w-4" /> },
    { label: 'Periods', type: 'period', icon: <Clock className="h-4 w-4" /> },
    { label: 'Techniques', type: 'technique', icon: <Palette className="h-4 w-4" /> },
    { label: 'Tags', type: 'tag', icon: <Filter className="h-4 w-4" /> },
  ];

  return (
    <div className="mt-8 border-b border-muted mb-8">
      <nav className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
        <Link
          href="/categories"
          className="flex items-center gap-2 whitespace-nowrap pb-2 px-1 text-sm font-medium border-transparent text-muted-foreground hover:text-foreground"
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
                : 'border-transparent text-muted-foreground hover:text-foreground'
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

function getCategoryTypeLabel(type: CategoryType): string {
  const labels: Record<CategoryType, string> = {
    'genre': 'Genres',
    'style': 'Styles',
    'period': 'Periods',
    'technique': 'Techniques',
    'tag': 'Tags',
  };

  return labels[type] || 'Categories';
}

function getCategoryTypeIcon(type: CategoryType): React.ReactNode {
  const icons: Record<CategoryType, React.ReactNode> = {
    'genre': <Palette className="h-5 w-5 text-primary" />,
    'style': <Layers className="h-5 w-5 text-primary" />,
    'period': <Clock className="h-5 w-5 text-primary" />,
    'technique': <Palette className="h-5 w-5 text-primary" />,
    'tag': <Filter className="h-5 w-5 text-primary" />,
  };

  return icons[type];
}

// Main Category Type Content
async function CategoryTypeContent({ type }: { type: CategoryType }) {
  const isValidType = ['genre', 'style', 'period', 'technique', 'tag'].includes(type);

  if (!isValidType) {
    return notFound();
  }

  const response = await getCategories(type as CategoryType, 100);

  if (!response.success) {
    return <ErrorState error={response.error || `Failed to load ${type} categories`} />;
  }

  const categories = response.data;
  const typeLabel = getCategoryTypeLabel(type as CategoryType);
  const typeIcon = getCategoryTypeIcon(type as CategoryType);

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/categories" className="text-sm text-muted-foreground hover:text-foreground">
            Categories
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{typeLabel}</span>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/artworks">
              <Palette className="mr-2 h-4 w-4" />
              All Artworks
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          {typeIcon}
          Browse by {typeLabel}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Explore our collection of artwork organized by {typeLabel.toLowerCase()}.
        </p>
      </div>

      <CategoryTypeTabs activeType={type as CategoryType} />

      <div className="mt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Badge variant="outline" className="rounded-md px-2 py-1 font-normal">
              {categories.length}
            </Badge>
            {typeLabel}
          </h2>

          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={`Search ${typeLabel.toLowerCase()}...`}
              className="pl-9 w-full md:w-[300px]"
            />
          </div>
        </div>

        <CategoryGrid categories={categories} />
      </div>
    </div>
  );
}

export default function CategoryTypePage({ params }: { params: { type: string } }) {
  const type = params.type as CategoryType;

  return (
    <Suspense fallback={<LoadingState />}>
      <CategoryTypeContent type={type} />
    </Suspense>
  );
}
