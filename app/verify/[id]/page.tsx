"use client";

import { useEffect, useState } from "react";
import { 
  CheckCircle2, AlertCircle, Loader2, User, Mail, 
  Building2, Calendar, Smartphone, Printer, Download, UserPlus
} from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface RegistrationData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: string;
  scannedAt?: string;
  isScanned: boolean;
  isCheckedIn: boolean;
  checkedInAt?: string;
  customFields: Record<string, any>;
}

export default function VerifyPage() {
  const { id } = useParams();
  const [data, setData] = useState<{ registration: RegistrationData; alreadyScanned: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch(`/api/verify/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Verification failed");
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-red-100 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Verification Failed</h1>
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const { registration, alreadyScanned, message } = data!;

  return (
    <div className="min-h-screen bg-slate-50 md:p-8 flex items-center justify-center">
      
      {/* 🛑 PRINT-ONLY SECTION (Hidden on screen, visible on paper) */}
      <div className="hidden print:block print:w-full print:p-10 font-sans text-black">
        <div style={{ border: '2px solid black', padding: '40px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
            {alreadyScanned ? 'ALREADY SCANNED' : 'ENTRY VERIFIED'}
          </h1>
          <p style={{ fontSize: '18px', margin: '0 0 30px 0', borderBottom: '1px solid #ccc', paddingBottom: '20px' }}>
            {message}
          </p>
          
          <div style={{ textAlign: 'left', marginBottom: '30px' }}>
            <p style={{ margin: '5px 0' }}><strong>NAME:</strong> {registration.name}</p>
            <p style={{ margin: '5px 0' }}><strong>EMAIL:</strong> {registration.email}</p>
            <p style={{ margin: '5px 0' }}><strong>COMPANY:</strong> {registration.company || "N/A"}</p>
            <p style={{ margin: '5px 0' }}><strong>STATUS:</strong> {registration.status.toUpperCase()}</p>
            <p style={{ margin: '5px 0' }}><strong>TIME:</strong> {new Date().toLocaleString()}</p>
          </div>

          {Object.entries(registration.customFields).length > 0 && (
            <div style={{ textAlign: 'left', borderTop: '1px solid #eee', paddingTop: '20px' }}>
               <p style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>ADDITIONAL INFO:</p>
               {Object.entries(registration.customFields).map(([k, v]) => (
                 <p key={k} style={{ margin: '3px 0' }}>{k.toUpperCase()}: {String(v)}</p>
               ))}
            </div>
          )}
        </div>
      </div>

      {/* 💻 SCREEN-ONLY SECTION (Hidden on print) */}
      <div className="max-w-2xl w-full bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden print:hidden">
        
        {/* Status Header */}
        <div className={`p-8 md:p-12 text-center border-b ${alreadyScanned ? 'bg-amber-50/50' : 'bg-emerald-50/50'}`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${alreadyScanned ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
            {alreadyScanned ? <AlertCircle className="h-10 w-10" /> : <CheckCircle2 className="h-10 w-10" />}
          </div>
          <h1 className={`text-3xl font-bold tracking-tight mb-2 ${alreadyScanned ? 'text-amber-800' : 'text-emerald-800'}`}>
            {alreadyScanned ? 'Already Scanned' : 'Verified Successfully'}
          </h1>
          <p className="text-slate-500 font-medium">{message}</p>
        </div>

        {/* User Details Grid */}
        <div className="p-8 md:p-12 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
            <DetailItem icon={<User />} label="Full Name" value={registration.name} isPrimary />
            <DetailItem icon={<Mail />} label="Email Address" value={registration.email} allowBreak />
            <DetailItem icon={<Building2 />} label="Company" value={registration.company || "N/A"} />
            <DetailItem icon={<Smartphone />} label="Phone" value={registration.phone || "N/A"} />
            <DetailItem 
              icon={<Calendar />} 
              label="Scanned At" 
              value={registration.scannedAt ? new Date(registration.scannedAt).toLocaleString() : "Just now"} 
            />
            <DetailItem 
              icon={<CheckCircle2 />} 
              label="Registration Status" 
              value={registration.status.replace('_', ' ').toUpperCase()} 
              isStatus
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-xl font-bold transition-all active:scale-95"
              >
                <Printer className="h-4 w-4" /> Print Badge
              </button>
              <button 
                onClick={() => {
                  document.title = `Badge_${registration.name.replace(/\s+/g, '_')}`;
                  window.print();
                }}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-200"
              >
                <Download className="h-4 w-4" /> Download PDF
              </button>
            </div>
            
            <Link 
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl font-bold transition-all hover:bg-emerald-100 active:scale-95"
            >
              <UserPlus className="h-4 w-4" /> Register Another Person
            </Link>
          </div>
          
          <div className="text-center">
            <button onClick={() => window.close()} className="text-sm font-medium text-slate-400">
              Dismiss Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value, isPrimary = false, isStatus = false, allowBreak = false }: { icon: React.ReactNode; label: string; value: string; isPrimary?: boolean; isStatus?: boolean; allowBreak?: boolean }) {
  return (
    <div className="flex gap-4 items-start">
      <div className={`p-3 rounded-xl flex-shrink-0 ${isStatus ? 'bg-primary/10 text-primary' : 'bg-slate-50 text-slate-400'}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
        <p className={`
          ${isPrimary ? 'text-xl font-bold text-slate-900' : 'text-base font-semibold text-slate-700'} 
          ${isStatus ? 'text-primary' : ''}
          ${allowBreak ? 'break-all' : 'truncate'}
          leading-tight
        `}>
          {value}
        </p>
      </div>
    </div>
  );
}
