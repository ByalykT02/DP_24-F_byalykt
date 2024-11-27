"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { XCircle } from "lucide-react";

export default function AuthErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const error = searchParams.get("error");

  useEffect(() => {
    if (!error) {
      router.push("/auth/login");
    }
  }, [error, router]);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center">
            <XCircle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-center text-2xl">Authentication Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            {error === "OAuthSignin" && "Error occurred during OAuth sign-in."}
            {error === "OAuthCallback" && "Error occurred during OAuth callback."}
            {error === "OAuthCreateAccount" && "Could not create OAuth account."}
            {error === "EmailCreateAccount" && "Could not create email account."}
            {error === "Callback" && "Error occurred during callback."}
            {error === "OAuthAccountNotLinked" && 
              "Email already exists with different provider."}
            {error === "EmailSignin" && "Error sending email signin link."}
            {error === "CredentialsSignin" && 
              "Invalid credentials. Please check your email and password."}
            {error === "SessionRequired" && "Please sign in to access this page."}
            {!error && "An unknown error occurred."}
          </p>

          <div className="flex justify-center gap-4">
            <Button onClick={() => router.back()}>Go Back</Button>
            <Button
              variant="outline"
              onClick={() => router.push("/auth/login")}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}