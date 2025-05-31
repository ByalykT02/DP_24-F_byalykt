import { auth } from "auth";
import { redirect } from "next/navigation";
import {
  getTotalUsers,
  getNewUsersCount,
  getUserRoleDistribution,
  getTotalArtworks,
  getTotalArtists,
  getNewContentCount,
  getTotalViewingHistoryEntries,
  getTotalUserCollections,
  getTotalFavoriteArtworks,
  getUserRegistrationsOverTime,
  getArtworkViewsOverTime,
} from "~/server/data/analytics";

import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Users, Palette, Image, Heart, Star, Eye } from "lucide-react";

import UserRegistrationsChart from "~/components/admin/charts/UserRegistrationsChart"
import ArtworkViewsChart from "~/components/admin/charts/ArtworkViewsChart";
import RoleDistributionChart from "~/components/admin/charts/RoleDistributionChart";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, description }) => (
  <Card className="flex flex-col">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
);

export default async function AdminAnalyticsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login?error=unauthorized");
  }

  const [
    totalUsers,
    newUsersCount,
    userRoleDistribution,
    totalArtworks,
    totalArtists,
    newContentCounts,
    totalViewingHistoryEntries,
    totalUserCollections,
    totalFavoriteArtworks,
    userRegistrationsData,
    artworkViewsData,
  ] = await Promise.all([
    getTotalUsers(),
    getNewUsersCount(),
    getUserRoleDistribution(),
    getTotalArtworks(),
    getTotalArtists(),
    getNewContentCount(),
    getTotalViewingHistoryEntries(),
    getTotalUserCollections(),
    getTotalFavoriteArtworks(),
    getUserRegistrationsOverTime('month'),
    getArtworkViewsOverTime('day', 60),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard - Analytics</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Users"
          value={totalUsers}
          icon={Users}
          description={`+${newUsersCount} new users last 30 days`}
        />
        <StatCard
          title="Total Artworks"
          value={totalArtworks}
          icon={Image}
          description={`+${newContentCounts.newArtworks} new artworks last 30 days`}
        />
        <StatCard
          title="Total Artists"
          value={totalArtists}
          icon={Palette}
          description={`+${newContentCounts.newArtists} new artists last 30 days`}
        />
        <StatCard
          title="Total Views"
          value={totalViewingHistoryEntries.toLocaleString()}
          icon={Eye}
          description="All time artwork views"
        />
        <StatCard
          title="Total Collections"
          value={totalUserCollections}
          icon={Heart}
        />
        <StatCard
          title="Total Favorites"
          value={totalFavoriteArtworks}
          icon={Heart}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>User Registrations Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <UserRegistrationsChart data={userRegistrationsData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Role Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px]">
            <RoleDistributionChart data={userRoleDistribution} />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Artwork Views (Last 60 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ArtworkViewsChart data={artworkViewsData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
