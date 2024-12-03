import { auth, signOut } from "auth";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { LogOut, User } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LogoutButton } from "~/components/auth/logout-button";
import { ArtworkPreferences } from "~/components/preferences/user-preferences";

const ProfilePage = async () => {
  const session = await auth();
  console.log(session);
  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Profile</h2>
            <div>
            <LogoutButton>
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </LogoutButton>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            {session.user.image ? (
              <div className="relative h-20 w-20 overflow-hidden rounded-full">
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? "Profile"}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
                <User className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-medium">{session.user.name}</h3>
              <p className="text-sm text-muted-foreground">
                {session.user.email}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                Account Details
              </h4>
              <div className="grid gap-2">
                <div className="flex justify-between border-b py-2">
                  <span className="text-sm font-medium">User ID</span>
                  <span className="text-sm text-muted-foreground">
                    {session.user.id}
                  </span>
                </div>
                <div className="flex justify-between border-b py-2">
                  <span className="text-sm font-medium">Email verified</span>
                  <span className="text-sm text-muted-foreground">
                    {session.user.email ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Account Actions
              </h4>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Edit Profile
                </Button>
                <Button variant="outline" size="sm">
                  Change Password
                </Button>
              </div>
            </div>
            <ArtworkPreferences/>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
