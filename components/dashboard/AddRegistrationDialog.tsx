"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DynamicForm } from "@/components/forms/DynamicForm";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddRegistrationDialog({ open, onClose, onSuccess }: Props) {
  const router = useRouter();
  async function handleSubmit(data: Record<string, unknown>) {
    const { name, email, phone, company, newsletter, role, tshirt, ...rest } = data as Record<string, string>;

    const res = await fetch("/api/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone,
        company,
        status: "registered", // On-site registration
        customFields: { newsletter, role, tshirt, ...rest },
      }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Registration failed");

    toast.success(`${name} registered successfully!`);
    
    // Refresh the table first
    onSuccess();
    
    // Redirect to the verification/details page
    router.push(`/verify/${json.registration._id}`);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>On-site Registration</DialogTitle>
        </DialogHeader>
        <DynamicForm
          formSlug="pre-registration"
          onSubmit={handleSubmit}
          submitLabel="Register On-site"
        />
      </DialogContent>
    </Dialog>
  );
}
