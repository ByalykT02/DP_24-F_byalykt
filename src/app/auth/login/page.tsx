"use client";

import { login } from "actions/login";
import { useState, useTransition } from "react";
import { LoginSchema } from "schemas";
import * as z from "zod";
import { RegisterButton } from "~/components/auth/register-button";
import { AuthForm } from "~/components/form/auth-form";
import { Button } from "~/components/ui/button";

import { AuthResponse } from "~/lib/types/auth-form";

const LoginPage = () => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const fields = [
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "m@example.com",
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      placeholder: "********",
    },
  ];

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    startTransition(() => {
      login(values)
        .then((data: AuthResponse) => {
          if ("error" in data) {
            setError(data.error);
            setSuccess(undefined);
          } else {
            setSuccess(data.success);
            setError(undefined);
          }
        })
        .catch((err) => {
          setError("Something went wrong");
          setSuccess(undefined);
        });
    });
  };

  return (
    <AuthForm
      title="Welcome back"
      description="Sign in to your account to continue"
      schema={LoginSchema}
      fields={fields}
      submitLabel="Sign In"
      success={success}
      error={error}
      onSubmit={onSubmit}
      disabled={isPending}
      alternativeAction={
        <RegisterButton>
          <Button
            variant="outline"
            disabled={isPending}
            className="mt-6 w-full"
          >
            Create an account
          </Button>
        </RegisterButton>
      }
    />
  );
};

export default LoginPage;
