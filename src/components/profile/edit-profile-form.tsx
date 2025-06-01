import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import { updateProfile } from "~/server/actions/auth/update-profile";
import { toast } from "src/hooks/use-toast";
import { User } from "next-auth";
import { cn } from "~/lib/utils";

const EditProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters")
    .regex(
      /^[a-zA-Z\s-']+$/,
      "Name can only contain letters, spaces, hyphens, and apostrophes",
    ),
  email: z
    .string()
    .email("Invalid email address")
    .max(100, "Email cannot exceed 100 characters"),
  image: z
    .string()
    .url("Invalid URL")
    .max(500, "URL cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
});

type FormValues = z.infer<typeof EditProfileSchema>;

interface EditProfileFormProps {
  user: Pick<User, "id" | "name" | "email" | "image">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileUpdated: (updatedUser: Partial<User>) => void;
}

export function EditProfileForm({
  user,
  open,
  onOpenChange,
  onProfileUpdated,
}: EditProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [dirtyFields, setDirtyFields] = useState<
    Partial<Record<keyof FormValues, boolean>>
  >({});

  const form = useForm<FormValues>({
    resolver: zodResolver(EditProfileSchema),
    defaultValues: {
      name: user.name || "",
      email: user.email || "",
      image: user.image || "",
    },
  });

  const handleClose = () => {
    form.reset();
    setDirtyFields({});
    onOpenChange(false);
  };

  const onSubmit = async (values: FormValues) => {
    if (!Object.keys(dirtyFields).length) {
      toast({
        title: "No changes detected",
        description: "Make some changes before saving.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateProfile(values);

      if (result.success) {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });

        // Pass only the updated fields to the callback
        const updatedFields: Partial<User> = {};
        if (dirtyFields.name) updatedFields.name = values.name;
        if (dirtyFields.email) updatedFields.email = values.email;
        if (dirtyFields.image) updatedFields.image = values.image || null;

        await onProfileUpdated(updatedFields);
        handleClose();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Track field changes
  const onFieldChange = (fieldName: keyof FormValues) => {
    const currentValue = form.getValues(fieldName);
    const defaultValue = user[fieldName as keyof typeof user];

    setDirtyFields((prev) => ({
      ...prev,
      [fieldName]: currentValue !== defaultValue,
    }));
  };

  const hasChanges = Object.keys(dirtyFields).length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile information below
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isLoading}
                      onChange={(e) => {
                        field.onChange(e);
                        onFieldChange("name");
                      }}
                      className={cn(
                        dirtyFields.name &&
                          "border-blue-500 dark:border-blue-400",
                      )}
                    />
                  </FormControl>
                  <FormDescription>
                    Your full name or display name
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      disabled={isLoading}
                      onChange={(e) => {
                        field.onChange(e);
                        onFieldChange("email");
                      }}
                      className={cn(
                        dirtyFields.email &&
                          "border-blue-500 dark:border-blue-400",
                      )}
                    />
                  </FormControl>
                  <FormDescription>Your primary email address</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Image URL</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isLoading}
                      onChange={(e) => {
                        field.onChange(e);
                        onFieldChange("image");
                      }}
                      className={cn(
                        dirtyFields.image &&
                          "border-blue-500 dark:border-blue-400",
                      )}
                    />
                  </FormControl>
                  <FormDescription>
                    A URL pointing to your profile image
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !hasChanges}
                className="min-w-[100px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
