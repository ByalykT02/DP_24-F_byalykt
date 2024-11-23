"use client";

import { LoginSchema } from "schemas";

import { RegisterButton } from "~/components/auth/register-button";
import { AuthForm } from "~/components/form/auth-form";
import { Button } from "~/components/ui/button";

const LoginPage = () => {
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

  const onSubmit = (values: any) => {
    console.log(values);
  };

  return (
    <AuthForm
      title="Welcome back"
      description="Sign in to your account to continue"
      schema={LoginSchema}
      fields={fields}
      submitLabel="Sign In"
      onSubmit={onSubmit}
      alternativeAction={
        <RegisterButton>
          <Button variant="outline" className="mt-6 w-full">
            Create an account
          </Button>
        </RegisterButton>
      }
    />
  );
};

export default LoginPage;