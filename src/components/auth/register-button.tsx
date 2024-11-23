"use client";

import { useRouter } from "next/navigation";

interface RegisterButtonProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export const RegisterButton = ({ children, asChild }: RegisterButtonProps) => {
  const router = useRouter();

  const onClick = () => { 
    router.push("/auth/register")
  }
  
  return (
    <span onClick={onClick} className="cursor-pointer">{children}</span>
  )
};
