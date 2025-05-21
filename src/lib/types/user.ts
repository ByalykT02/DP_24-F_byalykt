export type UserForManagement = {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "USER";
  emailVerified: Date | null;
};

