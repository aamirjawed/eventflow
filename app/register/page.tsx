import { Metadata } from "next";
import { RegisterForm } from "./RegisterForm";
import { Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Register | EventFlow",
  description: "Pre-register for the event",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold">
            {process.env.NEXT_PUBLIC_APP_NAME || "EventFlow"}
          </span>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Pre-register</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Secure your spot at the event
            </p>
          </div>

          <RegisterForm />
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Already registered?{" "}
          <a href="/login" className="text-primary hover:underline font-medium">
            Admin sign in →
          </a>
        </p>
      </div>
    </div>
  );
}
