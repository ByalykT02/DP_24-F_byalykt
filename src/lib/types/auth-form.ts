import * as z from "zod";

export interface FormField {
  name: string;
  label: string;
  type: string;
  placeholder: string;
}

export interface AuthFormProps{
  title: string;
  description: string;
  schema: z.ZodType<any>;
  fields: FormField[];
  submitLabel: string;
  onSubmit: (values: any) => void;
  alternativeAction: React.ReactNode
}