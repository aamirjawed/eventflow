"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Beaker, UserPlus, Scan, ExternalLink, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";

export default function TestPage() {
  const [loading, setLoading] = useState(false);
  const [testUser, setTestUser] = useState<{ id: string; name: string } | null>(null);

  async function createTestUser() {
    setLoading(true);
    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User " + Math.floor(Math.random() * 1000),
          email: `test-${Date.now()}@example.com`,
          status: "pre_registered",
          customFields: { role: "Beta Tester", tshirt: "L" }
        }),
      });
      const data = await res.json();
      if (data.registration) {
        setTestUser({ id: data.registration._id, name: data.registration.name });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <Beaker className="h-8 w-8 text-primary" />
          QR System Simulator
        </h1>
        <p className="text-muted-foreground mt-2">
          Use this tool to test the entire flow from registration to check-in.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Step 1: Create */}
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-xl border border-gray-100 dark:border-gray-800 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">1</div>
            <h2 className="text-xl font-bold">Create Test User</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Generate a dummy registration in the database to get a unique verification ID.
          </p>
          <button
            onClick={createTestUser}
            disabled={loading}
            className="w-full py-4 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
            Create Random Attendee
          </button>
        </div>

        {/* Step 2: Scan */}
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-xl border border-gray-100 dark:border-gray-800 space-y-6 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-4 self-start">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">2</div>
            <h2 className="text-xl font-bold">Scan QR Code</h2>
          </div>
          
          {testUser ? (
            <div className="space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="p-4 bg-white rounded-3xl shadow-2xl border-4 border-primary/10">
                <QRCodeSVG value={`${window.location.origin}/verify/${testUser.id}`} size={200} />
              </div>
              <div className="space-y-2">
                <p className="font-bold text-lg">{testUser.name}</p>
                <p className="text-xs text-muted-foreground font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">{testUser.id}</p>
              </div>
              
              <div className="grid grid-cols-1 gap-3 w-full">
                <a 
                  href={`/verify/${testUser.id}`} 
                  target="_blank"
                  className="flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all"
                >
                  <ExternalLink className="h-4 w-4" />
                  Simulate Scan (Open in New Tab)
                </a>
                <p className="text-[10px] text-muted-foreground">
                  Or scan this screen with your phone camera!
                </p>
              </div>
            </div>
          ) : (
            <div className="py-12 text-muted-foreground flex flex-col items-center gap-3">
              <Scan className="h-12 w-12 opacity-20" />
              <p className="text-sm">Create a test user first to see their QR code</p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-primary/5 rounded-[2.5rem] p-8 border border-primary/10">
        <h3 className="font-bold flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          Test Scenarios to Try:
        </h3>
        <ul className="space-y-4">
          <li className="flex gap-3">
            <ChevronRight className="h-5 w-5 text-primary flex-shrink-0" />
            <p className="text-sm"><strong>First Scan:</strong> Click "Simulate Scan". You should see a success message and a "Verified" status with the current timestamp.</p>
          </li>
          <li className="flex gap-3">
            <ChevronRight className="h-5 w-5 text-primary flex-shrink-0" />
            <p className="text-sm"><strong>Duplicate Scan:</strong> Refresh the verification page or click the link again. It should now show "Already Scanned" with the original timestamp.</p>
          </li>
          <li className="flex gap-3">
            <ChevronRight className="h-5 w-5 text-primary flex-shrink-0" />
            <p className="text-sm"><strong>Mobile Test:</strong> Open the QR code on your computer and use your phone's camera to scan it. It will open the check-in page on your mobile device.</p>
          </li>
        </ul>
      </div>
    </div>
  );
}
