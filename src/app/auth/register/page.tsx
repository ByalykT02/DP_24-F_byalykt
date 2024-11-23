"use client";
import * as z from "zod";

import { RegistrationSchema } from "schemas";
import { LoginButton } from "~/components/auth/login-button";
import { AuthForm } from "~/components/form/auth-form";
import { Button } from "~/components/ui/button";
import { useTransition } from "react";
import { register } from "actions/register";
import { RegisterButton } from "~/components/auth/register-button";

const RegistrationPage = () => {
  const [isPending, startTransition] = useTransition();

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

  const onSubmit = (values: z.infer<typeof RegistrationSchema>) => {
    startTransition(() => {
      register(values);
    });
  };

  return (
    <AuthForm
      title="Create an account"
      description="Enter your information to get started"
      schema={RegistrationSchema}
      disabled={isPending}
      fields={fields}
      submitLabel="Sign Up"
      onSubmit={onSubmit}
      alternativeAction={
        <RegisterButton>
          <Button variant="outline" className="mt-4 w-full">
            Sign In
          </Button>
        </RegisterButton>
      }
    />
  );
};

export default RegistrationPage;
