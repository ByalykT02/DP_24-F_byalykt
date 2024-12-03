"use client";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "~/components/ui/form";
import { MultiSelect } from "~/components/ui/multi-select";

const STYLE_OPTIONS = [
  "Impressionism",
  "Realism",
  "Abstract",
  "Modern",
  "Contemporary",
  // Add more styles
];

const PERIOD_OPTIONS = [
  "Renaissance",
  "Baroque",
  "Modern",
  "Contemporary",
  // Add more periods
];

export function ArtworkPreferences() {
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm({
    defaultValues: {
      preferredStyles: [],
      preferredPeriods: [],
    }
  });

  const onSubmit = async (values: any) => {
    setIsLoading(true);
    try {
      // Add API call to save preferences
      console.log(values);
    } catch (error) {
      console.error("Failed to save preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Controller
            control={form.control}
            name="preferredStyles"
            render={({ field: { onChange, value } }) => (
              <FormItem>
                <FormLabel>Preferred Styles</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={STYLE_OPTIONS.map(style => ({
                      label: style,
                      value: style
                    }))}
                    onValueChange={onChange}
                    defaultValue={value}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Controller
            control={form.control}
            name="preferredPeriods"
            render={({ field: { onChange, value } }) => (
              <FormItem>
                <FormLabel>Preferred Periods</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={PERIOD_OPTIONS.map(period => ({
                      label: period,
                      value: period
                    }))}
                    onValueChange={onChange}
                    defaultValue={value}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Preferences"}
          </Button>
        </form>
      </Form>
    </Card>
  );
}