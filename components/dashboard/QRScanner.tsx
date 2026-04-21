"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { Camera, RefreshCw } from "lucide-react";

export function QRScanner() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    function onScanSuccess(decodedText: string) {
      console.log(`Scan result: ${decodedText}`);
      
      // Stop scanner before navigating
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error("Failed to clear scanner", e));
      }

      // Check if the decoded text is a URL to our verification page
      try {
        const url = new URL(decodedText);
        if (url.pathname.startsWith('/verify/')) {
          router.push(url.pathname);
        } else {
          // If it's just an ID or some other string, try to treat it as an ID if it looks like a mongo ID
          if (decodedText.match(/^[0-9a-fA-F]{24}$/)) {
            router.push(`/verify/${decodedText}`);
          } else {
            alert("Invalid QR code for this event.");
            window.location.reload();
          }
        }
      } catch (e) {
        // Not a URL, check if it's a mongo ID
        if (decodedText.match(/^[0-9a-fA-F]{24}$/)) {
          router.push(`/verify/${decodedText}`);
        } else {
          alert("Invalid QR code format.");
          window.location.reload();
        }
      }
    }

    function onScanFailure(error: string) {
      // Too much noise if we log every failure
      // console.warn(`Code scan error: ${error}`);
    }

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );
    
    scanner.render(onScanSuccess, onScanFailure);
    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error("Cleanup error", e));
      }
    };
  }, [router]);

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-8 bg-primary/5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">Active Scanner</h2>
              <p className="text-xs text-muted-foreground font-medium">Align QR code within the frame</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6">
          <div id="qr-reader" className="overflow-hidden rounded-2xl border-0"></div>
        </div>

        <div className="p-6 bg-gray-50/50 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 animate-pulse" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Camera is active. The system will automatically process the badge once a valid QR code is detected.
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        #qr-reader {
          border: none !important;
        }
        #qr-reader__scan_region {
          background: #f8fafc !important;
          border-radius: 1rem !important;
        }
        #qr-reader__dashboard_section_csr button {
          background: #000 !important;
          color: #white !important;
          border: none !important;
          padding: 8px 16px !important;
          border-radius: 8px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
        }
        .dark #qr-reader__scan_region {
          background: #0f172a !important;
        }
      `}</style>
    </div>
  );
}
