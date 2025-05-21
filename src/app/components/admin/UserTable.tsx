"use client";

import React from 'react';
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
import { UserForManagement } from "~/lib/types/user";

interface UserTableProps {
  users: UserForManagement[];
}

export default function UserTable({ users }: UserTableProps) {
  return (
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
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
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
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  {user.emailVerified ? format(new Date(user.emailVerified), 'MMM dd, yyyy') : 'No'}
                </TableCell>
                <TableCell className="text-right flex space-x-2 justify-end">
                  <Button variant="outline" size="sm">Edit Role</Button>
                  <Button variant="destructive" size="sm">Delete</Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
