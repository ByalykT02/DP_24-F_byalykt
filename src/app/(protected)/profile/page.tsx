"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useCallback } from "react";
import { User } from "next-auth";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { EditProfileForm } from "~/components/profile/edit-profile-form";
import { ChangePasswordForm } from "~/components/profile/change-password-form";
import { ArtworkPreferences } from "~/components/preferences/user-preferences";
import { UserCircle2, Mail, Shield, UserCog, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

const ProfileSection = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <Icon className="h-4 w-4" />
      <h4>{title}</h4>
    </div>
    {children}
  </div>
);

const ProfileDetail = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between border-b py-2 transition-colors hover:bg-muted/50">
    <span className="text-sm font-medium">{label}</span>
    <span className="text-sm text-muted-foreground">{value}</span>
  </div>
);

const LoadingSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center space-x-4">
      <Skeleton className="h-20 w-20 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  </div>
);

const ProfilePage = () => {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({
        redirect: true,
        redirectTo: "/auth/login",
      });
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  const handleProfileUpdated = useCallback(
    async (updatedUser: Partial<User>) => {
      setIsUpdating(true);
      try {
        // This forces a session refresh with the new data
        await update({
          ...session,
          user: {
            ...session?.user,
            ...updatedUser,
          },
        });

        // Force a client-side refresh
        window.location.reload();
      } finally {
        setIsUpdating(false);
      }
    },
    [session, update],
  );

  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="mx-auto max-w-2xl">
          <CardContent className="p-6">
            <LoadingSkeleton />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const { user } = session;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Profile</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(true)}
                disabled={isUpdating}
                className="transition-all hover:shadow-md"
              >
                {isUpdating ? "Updating..." : "Edit Profile"}
              </Button>
              <Button
                variant="destructive"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                {isLoggingOut ? "Logging out..." : "Log Out"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={user.image || undefined}
                alt={user.name || "Profile"}
              />
              <AvatarFallback>
                <UserCircle2 className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-lg font-medium">{user.name}</h3>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                {user.email}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <ProfileSection title="Account Details" icon={UserCog}>
              <div className="grid gap-2 rounded-lg border p-4">
                <ProfileDetail label="User ID" value={user.id!} />
                <ProfileDetail
                  label="Email Status"
                  value={user.email ? "Verified" : "Not Verified"}
                />
              </div>
            </ProfileSection>

            <ProfileSection title="Security" icon={Shield}>
              <ChangePasswordForm />
            </ProfileSection>
          </div>
        </CardContent>

        <EditProfileForm
          user={user}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onProfileUpdated={handleProfileUpdated}
        />
      </Card>
    </div>
  );
};

export default ProfilePage;
