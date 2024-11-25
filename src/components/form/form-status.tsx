import { LucideCheck, LucideX } from "lucide-react";

interface FormStatusProps {
  error?: string;
  success?: string;
}

export default function FormStatus({ error, success }: FormStatusProps) {
  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
        <LucideX className="h-4 w-4" />
        <p>{error}</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-emerald-500/15 p-3 text-sm text-emerald-500">
        <LucideCheck className="h-4 w-4" />
        <p>{success}</p>
      </div>
    );
  }

  return null;
}