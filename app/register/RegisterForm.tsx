"use client";

import { useState } from "react";
import { DynamicForm } from "@/components/forms/DynamicForm";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle } from "lucide-react";
import { sunmiPrinter } from "@/lib/printer/sunmiPrinter";

export function RegisterForm() {
  const [success, setSuccess] = useState(false);
  const [name, setName] = useState("");
  const [regId, setRegId] = useState("");

  async function handleSubmit(data: Record<string, unknown>) {
    const { name: n, email, phone, company, newsletter, role, tshirt, ...rest } = data as Record<string, string>;

    const res = await fetch("/api/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: n,
        email,
        phone,
        company,
        status: "pre_registered",
        customFields: { newsletter, role, tshirt, ...rest },
      }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Registration failed");

    setName(n);
    setRegId(json.registration._id);
    setSuccess(true);
  }

  if (success) {
    const verifyUrl = `${window.location.origin}/verify/${regId}`;

    return (
      <div className="text-center py-4 space-y-6">
        <div className="flex justify-center transition-transform hover:scale-105 duration-300">
          <div className="relative p-4 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border-4 border-emerald-500/20">
            <QRCodeSVG value={verifyUrl} size={180} level="H" includeMargin={true} />
            <div className="absolute -top-3 -right-3 bg-emerald-500 rounded-full p-1.5 shadow-lg">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">You're in, {name}!</h2>
          <p className="text-muted-foreground text-sm max-w-[280px] mx-auto">
            This is your personal check-in QR code. Please save it or take a screenshot to show at the entrance.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-3">
          <button
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
            onClick={() =>
              sunmiPrinter.printTicket({
                id: regId,
                name,
                email: "",
                status: "pre_registered",
              })
            }
          >
            Print QR Code
          </button>
          <button
            className="text-muted-foreground text-xs hover:text-primary transition-colors"
            onClick={() => setSuccess(false)}
          >
            Register another person
          </button>
        </div>
      </div>
    );
  }

  return (
    <DynamicForm
      formSlug="pre-registration"
      onSubmit={handleSubmit}
      submitLabel="Pre-register →"
    />
  );
}
