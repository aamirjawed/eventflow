"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { Camera, RefreshCw, Play, Square } from "lucide-react";

export function QRScanner() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "starting" | "active" | "error">("idle");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Initialize the scanner instance once on mount
  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode("qr-reader-video");
    }

    // Cleanup on unmount
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => { });
      }
    };
  }, []);

  const startScanner = async () => {
    if (!scannerRef.current) return;

    setStatus("starting");
    setError(null);

    try {
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 25, qrbox: { width: 280, height: 280 } },
        (decodedText) => {
          console.log(`[SCAN] Decoded: ${decodedText}`);
          const idMatch = decodedText.match(/[0-9a-fA-F]{24}/);
          if (idMatch) {
            // Found a valid ID, stop and navigate
            stopScanner().then(() => {
              router.push(`/verify/${idMatch[0]}`);
            });
          } else {
            setError("Invalid QR format. Please scan a valid attendee badge.");
            setTimeout(() => setError(null), 3000);
          }
        },
        () => { /* Ignore per-frame failures */ }
      );
      setStatus("active");
    } catch (err) {
      console.error("[SCANNER] start() failed:", err);
      setStatus("error");
      setError("Camera permission denied or device not found. Please allow access.");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setStatus("idle");
      } catch (err) {
        console.error("[SCANNER] stop() failed:", err);
      }
    } else {
      setStatus("idle");
    }
  };

  // Auto-start scanner on initial load
  useEffect(() => {
    startScanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">

        {/* Header */}
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

        {/* Scanner Feed */}
        <div className="p-6">
          <div className="relative overflow-hidden rounded-2xl bg-black min-h-[300px] flex items-center justify-center">

            {/* The actual video element container */}
            <div id="qr-reader-video" className="w-full h-full [&_video]:object-cover" />

            {/* Overlay messages when not scanning */}
            {status === "starting" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-sm font-medium">
                Starting Camera...
              </div>
            )}

            {(status === "idle" || status === "error") && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center p-4">
                  <Camera className="h-10 w-10 text-gray-400 mx-auto mb-3 opacity-50" />
                  <p className="text-gray-300 text-sm">Camera is paused</p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-center text-xs font-semibold animate-in fade-in">
              {error}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="px-6 pb-6 space-y-4">
          <div className="flex justify-center">
            {status === "active" ? (
              <button
                onClick={stopScanner}
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-bold tracking-wide transition-all active:scale-95 shadow-lg w-full justify-center uppercase text-sm"
              >
                <Square className="h-4 w-4 fill-current" />
                Stop Scanning
              </button>
            ) : (
              <button
                onClick={startScanner}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold tracking-wide transition-all active:scale-95 shadow-lg shadow-blue-600/20 w-full justify-center uppercase text-sm"
              >
                <Play className="h-4 w-4 fill-current" />
                Start Camera
              </button>
            )}
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800">
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${status === "active" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {status === "active"
                ? "Camera is active. The system will automatically process the badge once a valid QR code is detected."
                : "Camera is currently inactive. Click Start Camera to begin scanning."}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
