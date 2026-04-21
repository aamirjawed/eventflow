/**
 * Run this once to seed a default form schema:
 *   npx tsx scripts/seed.ts
 *
 * Or call GET /api/admin/seed from the browser (dev only).
 */

import { connectDB } from "../lib/db";
import { FormSchema } from "../models/FormSchema";

export async function seedDefaultForm() {
  await connectDB();

  const existing = await FormSchema.findOne({ slug: "pre-registration" });
  if (existing) {
    console.log("Default form already exists.");
    return existing;
  }

  const form = await FormSchema.create({
    name: "Event Pre-Registration",
    slug: "pre-registration",
    description: "Register for the event in advance.",
    isActive: true,
    fields: [
      { id: "name", label: "Full Name", type: "text", required: true, placeholder: "John Doe", order: 1 },
      { id: "email", label: "Email Address", type: "email", required: true, placeholder: "john@example.com", order: 2 },
      { id: "phone", label: "Phone Number", type: "phone", required: false, placeholder: "+91 98765 43210", order: 3 },
      { id: "company", label: "Company / Organisation", type: "text", required: false, placeholder: "Acme Inc.", order: 4 },
      {
        id: "role",
        label: "Your Role",
        type: "select",
        required: false,
        options: ["Developer", "Designer", "Manager", "Founder", "Student", "Other"],
        order: 5,
      },
      {
        id: "tshirt",
        label: "T-Shirt Size",
        type: "select",
        required: false,
        options: ["XS", "S", "M", "L", "XL", "XXL"],
        order: 6,
      },
      {
        id: "newsletter",
        label: "Subscribe to newsletter",
        type: "checkbox",
        required: false,
        order: 7,
      },
    ],
  });

  console.log("Default form seeded:", form._id);
  return form;
}
