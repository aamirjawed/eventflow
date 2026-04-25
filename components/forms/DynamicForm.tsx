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

import { Settings2, Plus, Trash2, X, Save } from "lucide-react";
import { toast } from "sonner";

interface DynamicFormProps {
  formSlug?: string;
  schema?: IFormSchema;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  submitLabel?: string;
  defaultValues?: Record<string, unknown>;
  canEdit?: boolean;
}

export function DynamicForm({
  formSlug = "pre-registration",
  schema: propSchema,
  onSubmit,
  submitLabel = "Submit",
  defaultValues = {},
  canEdit = true,
}: DynamicFormProps) {
  const [schema, setSchema] = useState<IFormSchema | null>(propSchema || null);
  const [loading, setLoading] = useState(!propSchema);
  const [submitting, setSubmitting] = useState(false);
  const [isEditingSchema, setIsEditingSchema] = useState(false);
  const [error, setError] = useState("");

  // State for new field builder
  const [newField, setNewField] = useState<Partial<IFormField>>({
    type: "text",
    required: false,
  });

  const fetchSchema = () => {
    setLoading(true);
    fetch(`/api/forms?slug=${formSlug}`)
      .then((r) => r.json())
      .then((d) => setSchema(d.form))
      .catch(() => setError("Failed to load form"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (propSchema) return;
    fetchSchema();
  }, [formSlug, propSchema]);

  const saveSchema = async (updatedFields: IFormField[]) => {
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: formSlug, fields: updatedFields }),
      });
      if (!res.ok) throw new Error("Failed to save schema");
      toast.success("Form structure updated!");
      fetchSchema(); // Refresh to ensure sync
    } catch (err) {
      toast.error("Failed to update form structure");
    }
  };

  const handleAddField = () => {
    if (!newField.label) return toast.error("Label is required");
    const id = newField.label.toLowerCase().replace(/\s+/g, "_");
    if (schema?.fields.some(f => f.id === id)) return toast.error("Field already exists");

    const field: IFormField = {
      id,
      label: newField.label,
      type: (newField.type as any) || "text",
      required: !!newField.required,
      order: schema?.fields.length || 0,
    };

    const updatedFields = [...(schema?.fields || []), field];
    saveSchema(updatedFields);
    setNewField({ type: "text", required: false });
  };

  const handleDeleteField = (id: string) => {
    if (!confirm("Remove this field? Existing data using this key will remain in DB but won't show in form.")) return;
    const updatedFields = schema?.fields.filter(f => f.id !== id) || [];
    saveSchema(updatedFields);
  };

  const zodSchema = schema ? buildZodSchema(schema.fields) : z.object({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(zodSchema),
    defaultValues,
    // Re-validate when schema changes
    key: schema?.fields.length, 
  } as any);

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

  const fields = [...schema.fields].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* ⚙️ Form Manager Toggle */}
      {canEdit && (
        <div className="flex items-center justify-between p-3 bg-slate-50 border rounded-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Settings2 className="h-3.5 w-3.5" />
            Form Management
          </div>
          <Button 
            variant={isEditingSchema ? "default" : "outline"} 
            size="sm" 
            className="h-7 text-[10px] font-black uppercase"
            onClick={() => setIsEditingSchema(!isEditingSchema)}
          >
            {isEditingSchema ? "Exit Builder" : "Manage Fields"}
          </Button>
        </div>
      )}

      {isEditingSchema && (
        <div className="space-y-4 p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-white animate-in slide-in-from-top-2 duration-300">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Plus className="h-4 w-4 text-blue-600" />
            Add New Input
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-slate-400">Label</Label>
              <Input 
                placeholder="e.g. T-Shirt Size" 
                value={newField.label || ""}
                onChange={(e) => setNewField({...newField, label: e.target.value})}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-slate-400">Type</Label>
              <select 
                className="w-full h-8 px-2 rounded-md border text-sm"
                value={newField.type}
                onChange={(e) => setNewField({...newField, type: e.target.value as any})}
              >
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="checkbox">Checkbox</option>
                <option value="textarea">Long Text</option>
              </select>
            </div>
          </div>
          <Button onClick={handleAddField} size="sm" className="w-full h-8 gap-2 bg-blue-600 hover:bg-blue-700">
            <Save className="h-3.5 w-3.5" /> Save Field
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 relative">
        {fields.map((field) => (
          <div key={field.id} className="relative group space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor={field.id} className="flex items-center gap-1">
                {field.label}
                {field.required && <span className="text-destructive">*</span>}
              </Label>
              
              {isEditingSchema && (
                <button 
                  type="button"
                  onClick={() => handleDeleteField(field.id)}
                  className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {field.type === "select" ? (
              <Select id={field.id} {...register(field.id)}>
                <option value="">Select an option</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </Select>
            ) : field.type === "checkbox" ? (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-slate-50/50">
                <input
                  type="checkbox"
                  id={field.id}
                  {...register(field.id)}
                  className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                />
                <span className="text-sm text-slate-600 cursor-pointer select-none" onClick={() => document.getElementById(field.id)?.click()}>
                  {field.placeholder || field.label}
                </span>
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
              <p className="text-xs text-destructive animate-in fade-in slide-in-from-left-1">
                {errors[field.id]?.message as string}
              </p>
            )}
          </div>
        ))}

        {error && <p className="text-sm text-destructive bg-red-50 p-2 rounded border border-red-100">{error}</p>}

        {!isEditingSchema && (
          <Button type="submit" className="w-full shadow-lg shadow-primary/20 h-11 text-base font-bold" disabled={submitting}>
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : submitLabel}
          </Button>
        )}
      </form>
    </div>
  );
}
