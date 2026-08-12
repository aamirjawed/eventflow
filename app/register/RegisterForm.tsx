"use client";

import { useState } from "react";
import { DynamicForm } from "@/components/forms/DynamicForm";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle, Printer, ArrowRight } from "lucide-react";
import { sunmiPrinter } from "@/lib/printer/sunmiPrinter";
import { Button } from "@/components/ui/button";

export function RegisterForm() {
  const [success, setSuccess] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [regId, setRegId] = useState("");

  async function handleSubmit(data: Record<string, unknown>) {
    const { name: n, email: e, phone, company: c, newsletter, role, tshirt, ...rest } = data as Record<string, string>;

    const res = await fetch("/api/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: n,
        email: e,
        phone,
        company: c,
        status: "pre_registered",
        customFields: { newsletter, role, tshirt, ...rest },
      }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Registration failed");

    const newId = json.registration._id || json.registration.id;
    setName(n);
    setEmail(e);
    setCompany(c || "");
    setRegId(newId);
    setSuccess(true);
  }

  if (success) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const verifyUrl = `${origin}/verify/${regId}`;

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
          <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
            Pre-registration Complete!
          </h2>
          <p className="text-muted-foreground text-sm max-w-[290px] mx-auto">
            Welcome, <strong className="text-slate-900 dark:text-white">{name}</strong>! Your ticket pass is ready. Please present this QR code to the entrance staff at the event.
          </p>
        </div>

        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full py-6 text-base font-bold shadow-lg gap-2"
            onClick={() =>
              sunmiPrinter.printTicket({
                id: regId,
                name,
                email,
                company,
                status: "pre_registered",
              })
            }
          >
            <Printer className="h-5 w-5" />
            Print Ticket Pass
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs text-muted-foreground hover:text-slate-900"
            onClick={() => {
              setSuccess(false);
              setName("");
              setEmail("");
              setCompany("");
              setRegId("");
            }}
          >
            Register Another Attendee
          </Button>
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
