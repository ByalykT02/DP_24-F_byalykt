import UserTable from "~/app/components/admin/UserTable";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { getAllUsersForManagement } from "~/server/data/users";

export default async function AdminUsersPage() {
  const users = await getAllUsersForManagement();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">User Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <UserTable users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
