import mongoose, { Schema, Document, Model } from "mongoose";

/** Dynamic form field value */
export type FieldValue = string | boolean | string[];

export interface IRegistration extends Document {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: "pre_registered" | "registered" | "checked_in";
  customFields: Record<string, FieldValue>;
  eventId?: string;
  isScanned: boolean;
  scannedAt?: Date;
  isCheckedIn: boolean;
  checkedInAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RegistrationSchema = new Schema<IRegistration>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pre_registered", "registered", "checked_in"],
      default: "pre_registered",
    },
    customFields: { type: Schema.Types.Mixed, default: {} },
    eventId: { type: String },
    isScanned: { type: Boolean, default: false },
    scannedAt: { type: Date },
    isCheckedIn: { type: Boolean, default: false },
    checkedInAt: { type: Date },
  },
  { timestamps: true, collection: "registrations" }
);

// Index for fast lookups (Essential for 25k+ scalability)
RegistrationSchema.index({ email: 1 });
RegistrationSchema.index({ status: 1 });
RegistrationSchema.index({ isCheckedIn: 1 }); // New index for the dashboard filter
RegistrationSchema.index({ createdAt: -1 });
RegistrationSchema.index({ name: "text", email: "text", company: "text" }); // Text index for lightning-fast search

export const Registration: Model<IRegistration> =
  mongoose.models.Registration ||
  mongoose.model<IRegistration>("Registration", RegistrationSchema);
