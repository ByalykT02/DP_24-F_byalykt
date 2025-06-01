"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { UserForManagement } from "~/lib/types/user";
import { deleteUser, updateUserRole } from "~/server/actions/user-management";
import { useToast } from 'src/hooks/use-toast';
import ActionDialog from '~/components/common/action-dialog';
import EditRoleDialog from "./EditRoleDialog";

interface UserTableProps {
  users: UserForManagement[];
}

export default function UserTable({ users }: UserTableProps) {
  const [editRoleUser, setEditRoleUser] = useState<UserForManagement | null>(null);
  const [deleteUserData, setDeleteUserData] = useState<UserForManagement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive';
      case 'USER':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserData) return;

    setIsLoading(true);

    try {
      const result = await deleteUser(deleteUserData.id);

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setDeleteUserData(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: "USER" | "ADMIN") => {
    setIsLoading(true);

    try {
      const result = await updateUserRole(userId, newRole);

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-mono text-xs max-w-[100px] truncate">
                    {user.id}
                  </TableCell>
                  <TableCell>{user.name || 'N/A'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.emailVerified ? format(new Date(user.emailVerified), 'MMM dd, yyyy') : 'No'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex space-x-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditRoleUser(user)}
                        disabled={isLoading}
                      >
                        Edit Role
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteUserData(user)}
                        disabled={isLoading}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editRoleUser && (
        <EditRoleDialog
          user={editRoleUser}
          open={editRoleUser !== null}
          onOpenChange={(open) => !open && setEditRoleUser(null)}
          onRoleChange={handleRoleChange}
        />
      )}

      <ActionDialog
        isOpen={deleteUserData !== null}
        onOpenChange={(open) => !open && setDeleteUserData(null)}
        onAction={handleDeleteUser}
        title="Delete User"
        description={`This action cannot be undone. This will permanently delete the user ${deleteUserData?.name || deleteUserData?.email} and remove all of their data from our servers.`}
        buttonText={isLoading ? "Deleting..." : "Delete User"}
      />
    </>
  );
}
