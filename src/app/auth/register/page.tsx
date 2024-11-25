"use client";
import * as z from "zod";

import { RegisterSchema } from "schemas";
import { AuthForm } from "~/components/form/auth-form";
import { Button } from "~/components/ui/button";
import { useState, useTransition } from "react";
import { register } from "actions/register";
import { RegisterButton } from "~/components/auth/register-button";
import { AuthResponse } from "~/lib/types/auth-form";
import { LoginButton } from "~/components/auth/login-button";

const RegistrationPage = () => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const fields = [
    {
      name: "name",
      label: "Name",
      type: "text",
      placeholder: "John Doe",
    },
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
    {
      name: "confirm",
      label: "Confirm Password",
      type: "password",
      placeholder: "********",
    },
  ];

  const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      register(values)
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
      title="Create an account"
      description="Enter your information to get started"
      schema={RegisterSchema}
      disabled={isPending}
      fields={fields}
      submitLabel="Sign Up"
      onSubmit={onSubmit}
      success={success}
      error={error}
      alternativeAction={
        <LoginButton>
          <Button variant="outline" className="mt-4 w-full">
            Sign In
          </Button>
        </LoginButton>
      }
    />
  );
};

export default RegistrationPage;
