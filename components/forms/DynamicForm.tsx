"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input, Label, Select, Skeleton } from "@/components/ui/index";
import { Button } from "@/components/ui/button";
import type { IFormField, IFormSchema } from "@/models/FormSchema";
import { Loader2 } from "lucide-react";

interface DynamicFormProps {
  formSlug?: string;
  /** If provided, render with this schema instead of fetching */
  schema?: IFormSchema;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  submitLabel?: string;
  defaultValues?: Record<string, unknown>;
}

/** Build a Zod schema dynamically from form field definitions */
function buildZodSchema(fields: IFormField[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shape: Record<string, any> = {};

  for (const field of fields) {
    let validator: z.ZodTypeAny;

    switch (field.type) {
      case "email":
        validator = z.string().email("Invalid email address");
        break;
      case "phone":
        validator = z.string().regex(/^[+\d\s\-()]{7,20}$/, "Invalid phone number");
        break;
      case "checkbox":
        validator = z.boolean();
        break;
      default:
        validator = z.string();
    }

    if (field.required) {
      if (field.type !== "checkbox") {
        validator = (validator as z.ZodString).min(1, `${field.label} is required`);
      }
    } else {
      validator = validator.optional();
    }

    shape[field.id] = validator;
  }

  return z.object(shape);
}

export function DynamicForm({
  formSlug = "pre-registration",
  schema: propSchema,
  onSubmit,
  submitLabel = "Submit",
  defaultValues = {},
}: DynamicFormProps) {
  const [schema, setSchema] = useState<IFormSchema | null>(propSchema || null);
  const [loading, setLoading] = useState(!propSchema);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (propSchema) return;
    fetch(`/api/forms?slug=${formSlug}`)
      .then((r) => r.json())
      .then((d) => setSchema(d.form))
      .catch(() => setError("Failed to load form"))
      .finally(() => setLoading(false));
  }, [formSlug, propSchema]);

  const zodSchema = schema ? buildZodSchema(schema.fields) : z.object({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(zodSchema),
    defaultValues,
  });

  const onFormSubmit = async (data: Record<string, unknown>) => {
    setSubmitting(true);
    setError("");
    try {
      await onSubmit(data);
      reset();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!schema) return <p className="text-destructive text-sm">{error || "Form not found"}</p>;

  // Sort fields by order
  const fields = [...schema.fields].sort((a, b) => a.order - b.order);

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {fields.map((field) => (
        <div key={field.id} className="space-y-1.5">
          <Label htmlFor={field.id}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>

          {field.type === "select" ? (
            <Select id={field.id} {...register(field.id)}>
              <option value="">Select an option</option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </Select>
          ) : field.type === "checkbox" ? (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={field.id}
                {...register(field.id)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <span className="text-sm text-muted-foreground">{field.placeholder || field.label}</span>
            </div>
          ) : field.type === "textarea" ? (
            <textarea
              id={field.id}
              placeholder={field.placeholder}
              {...register(field.id)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          ) : (
            <Input
              id={field.id}
              type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
              placeholder={field.placeholder}
              {...register(field.id)}
            />
          )}

          {errors[field.id] && (
            <p className="text-xs text-destructive">{errors[field.id]?.message as string}</p>
          )}
        </div>
      ))}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}
