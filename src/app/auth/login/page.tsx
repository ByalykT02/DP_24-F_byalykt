"use client";

import { login } from "actions/login";
import { useState, useTransition } from "react";
import { LoginSchema } from "schemas";
import * as z from "zod";
import { RegisterButton } from "~/components/auth/register-button";
import { AuthForm } from "~/components/form/auth-form";
import { Button } from "~/components/ui/button";
import { useRouter } from "next/navigation";
import { DEFAULT_LOGIN_REDIRECT } from "routes";
import { useSession } from "next-auth/react";

const LoginPage = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const { update } = useSession();

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
    setError(undefined);
    setSuccess(undefined);

    startTransition(async () => {
      try {
        const result = await login(values);
        if (result?.error) {
          setError(result.error);
        } else if (result?.success) {
          setSuccess(result.success);
          await update();
          router.push(DEFAULT_LOGIN_REDIRECT);
          router.refresh();
        }
      } catch (err) {
        setError("Something went wrong");
      }
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
