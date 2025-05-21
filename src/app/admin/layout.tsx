import { auth } from "auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, LayoutDashboard, Brush, GalleryHorizontal, Heart, Clock } from "lucide-react"; // Import icons for navigation

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await auth();

  // Redirect if not authenticated or not an ADMIN
  if (!session?.user || session.user.role !== "ADMIN") {
    // You might want a more specific redirect or error page for unauthorized access
    redirect("/auth/login?error=unauthorized");
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 flex flex-col">
        <div className="text-2xl font-bold mb-8 text-gray-800">Admin Panel</div>
        <nav className="space-y-4">
          <Link href="/admin/dashboard" className="flex items-center space-x-3 p-2 rounded-md text-gray-700 hover:bg-gray-200">
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          {/* Add more admin navigation links here */}
          <Link href="/admin/users" className="flex items-center space-x-3 p-2 rounded-md text-gray-700 hover:bg-gray-200">
            <Users className="h-5 w-5" />
            <span>User Management</span>
          </Link>
          <Link href="/admin/artworks" className="flex items-center space-x-3 p-2 rounded-md text-gray-700 hover:bg-gray-200">
            <GalleryHorizontal className="h-5 w-5" />
            <span>Content Management</span>
          </Link>
          <Link href="/admin/artists" className="flex items-center space-x-3 p-2 rounded-md text-gray-700 hover:bg-gray-200">
            <Brush className="h-5 w-5" />
            <span>Artist Management</span>
          </Link>
          {/* You could add more links for: */}
          {/* <Link href="/admin/collections" className="flex items-center space-x-3 p-2 rounded-md text-gray-700 hover:bg-gray-200">
            <Heart className="h-5 w-5" />
            <span>User Collections</span>
          </Link>
          <Link href="/admin/viewing-history" className="flex items-center space-x-3 p-2 rounded-md text-gray-700 hover:bg-gray-200">
            <Clock className="h-5 w-5" />
            <span>Viewing History</span>
          </Link> */}
        </nav>
        <div className="mt-auto pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">Logged in as: {session.user?.name}</p>
          <p className="text-xs text-gray-500">Role: {session.user?.role}</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children} {/* This is where your admin pages (like dashboard/page.tsx) will render */}
      </main>
    </div>
  );
}
