"use client";

import { useSession } from "next-auth/react";

export default function MyComponent() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (status === "authenticated") {
    return (
      <div>
        <h1>Welcome, {session.user?.name}!</h1>
        <p>Your role: {session.user?.role}</p>

        {session.user?.role === "ADMIN" && (
          <p>You have admin privileges!</p>
        )}
      </div>
    );
  }

  return <p>Please log in.</p>;
}
