import mongoose, { Schema, Document, Model } from "mongoose";

/** A single field definition stored in DB */
export interface IFormField {
  id: string;              // Unique key, used as customFields key
  label: string;           // Display label
  type: "text" | "email" | "phone" | "select" | "checkbox" | "textarea";
  required: boolean;
  placeholder?: string;
  options?: string[];      // For select fields
  order: number;           // Display order
}

export interface IFormSchema extends Document {
  name: string;            // e.g. "Pre-Registration Form"
  slug: string;            // e.g. "pre-registration"
  description?: string;
  fields: IFormField[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FormFieldSchema = new Schema<IFormField>(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: ["text", "email", "phone", "select", "checkbox", "textarea"],
      required: true,
    },
    required: { type: Boolean, default: false },
    placeholder: String,
    options: [String],
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const FormSchemaModel = new Schema<IFormSchema>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    fields: [FormFieldSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const FormSchema: Model<IFormSchema> =
  mongoose.models.FormSchema ||
  mongoose.model<IFormSchema>("FormSchema", FormSchemaModel);
