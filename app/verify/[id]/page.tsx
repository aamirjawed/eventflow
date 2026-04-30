"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  CheckCircle2, AlertCircle, Loader2, User, Mail, 
  Building2, Calendar, Smartphone, Printer, Download, UserPlus,
  Settings2, Eye, EyeOff, Move, LayoutDashboard, Check, Camera
} from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

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

interface ElementConfig {
  x: number;
  y: number;
  visible: boolean;
}

interface BadgeConfig {
  appName: ElementConfig;
  name: ElementConfig;
  company: ElementConfig;
  status: ElementConfig;
  qr: ElementConfig;
}

const DEFAULT_CONFIG: BadgeConfig = {
  appName: { x: 16, y: 15, visible: true },
  name: { x: 16, y: 35, visible: true },
  company: { x: 16, y: 75, visible: true },
  status: { x: 16, y: 100, visible: true },
  qr: { x: 230, y: 30, visible: true },
};

export default function VerifyPage() {
  const { id } = useParams();
  const { status: sessionStatus } = useSession();
  const router = useRouter();

  const [data, setData] = useState<{ registration: RegistrationData; alreadyScanned: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Designer State
  const [isDesignMode, setIsDesignMode] = useState(false);
  const [config, setConfig] = useState<BadgeConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    // We allow public access now, but data will be masked if not logged in
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
          <p className="text-red-500 text-sm mb-6">{error}</p>
          <Link 
            href="/scan"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold transition-all active:scale-95"
          >
            <Camera className="h-4 w-4" /> Return to Scanner
          </Link>
        </div>
      </div>
    );
  }

  const { registration, alreadyScanned, message } = data!;
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "EventFlow";
  const badgeUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify/${id}`;

  const updatePos = (key: keyof BadgeConfig, x: number, y: number) => {
    setConfig(prev => ({
      ...prev,
      [key]: { ...prev[key], x, y }
    }));
  };

  const toggleVisible = (key: keyof BadgeConfig) => {
    setConfig(prev => ({
      ...prev,
      [key]: { ...prev[key], visible: !prev[key].visible }
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 md:p-8 flex items-center justify-center relative overflow-hidden">
      
      {/* 🛠️ Designer Overlay (Visible when editing) */}
      {isDesignMode && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-50 px-8 py-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Badge Designer</h2>
                  <p className="text-xs text-slate-400 font-medium">Drag to move • Click eye to hide</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDesignMode(false)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <Check className="h-4 w-4" /> Done Designing
              </button>
            </div>
            
            <div className="p-12 flex flex-col items-center justify-center bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
              <BadgeCard 
                data={{
                  name: registration.name,
                  company: registration.company || "N/A",
                  status: registration.status
                }} 
                appName={appName} 
                badgeUrl={badgeUrl} 
                config={config}
                editable={true}
                onUpdatePos={updatePos}
                onToggleVisible={toggleVisible}
              />
              
              <div className="mt-12 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4 text-blue-700">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Printer className="h-4 w-4" />
                </div>
                <p className="text-xs font-bold leading-tight">
                  Your custom layout will be saved for this print session.<br/>
                  Click print when ready.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🛑 PRINT-ONLY SECTION */}
      <div id="badge-print-area" className="hidden print:block">
        <BadgeCard 
          data={{
            name: registration.name,
            company: registration.company || "N/A",
            status: registration.status
          }} 
          appName={appName} 
          badgeUrl={badgeUrl} 
          config={config}
          print 
        />
      </div>

      {/* 💻 SCREEN-ONLY SECTION */}
      <div className="max-w-2xl w-full bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden print:hidden transition-all duration-500">
        
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
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-slate-200"
              >
                <Printer className="h-4 w-4" /> Print Badge
              </button>
              <button 
                onClick={() => setIsDesignMode(true)}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-200"
              >
                <Settings2 className="h-4 w-4" /> Customize Badge
              </button>
            </div>
            
            <Link 
              href="/scan"
              className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl font-bold transition-all hover:bg-emerald-100 active:scale-95"
            >
              <Camera className="h-4 w-4" /> Scan Next Badge
            </Link>
          </div>
          
          <div className="text-center">
            <button onClick={() => window.close()} className="text-sm font-medium text-slate-400">
              Dismiss Preview
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          html, body { margin: 0; padding: 0; background: white !important; }
          @page { size: 3.375in 2.125in; margin: 0; }
        }
      `}</style>
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

function BadgeCard({
  data,
  appName,
  badgeUrl,
  config,
  print = false,
  editable = false,
  onUpdatePos,
  onToggleVisible
}: {
  data: { name: string; company: string; status: string };
  appName: string;
  badgeUrl: string;
  config: BadgeConfig;
  print?: boolean;
  editable?: boolean;
  onUpdatePos?: (key: keyof BadgeConfig, x: number, y: number) => void;
  onToggleVisible?: (key: keyof BadgeConfig) => void;
}) {
  const cardWidth = 324;
  const cardHeight = 204;

  const style = print
    ? {
        width: "3.375in",
        height: "2.125in",
        position: 'relative' as const,
        backgroundColor: 'white',
        overflow: 'hidden'
      }
    : {
        width: `${cardWidth}px`,
        height: `${cardHeight}px`,
        position: 'relative' as const,
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
      };

  return (
    <div style={style}>
      <div className="absolute top-0 left-0 right-0 h-2 bg-blue-600" />
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-50" />

      <DraggableElement
        id="appName"
        x={config.appName.x}
        y={config.appName.y}
        visible={config.appName.visible}
        editable={editable}
        onMove={(x, y) => onUpdatePos?.('appName', x, y)}
        onToggle={() => onToggleVisible?.('appName')}
      >
        <Logo size="sm" className="scale-[0.4] origin-top-left -ml-1" />
      </DraggableElement>

      <DraggableElement
        id="name"
        x={config.name.x}
        y={config.name.y}
        visible={config.name.visible}
        editable={editable}
        onMove={(x, y) => onUpdatePos?.('name', x, y)}
        onToggle={() => onToggleVisible?.('name')}
      >
        <p className={`font-black text-slate-900 leading-[1.1] ${data.name.length > 18 ? 'text-base' : 'text-xl'}`} style={{ width: '200px', wordBreak: 'break-word' }}>
          {data.name}
        </p>
      </DraggableElement>

      <DraggableElement
        id="company"
        x={config.company.x}
        y={config.company.y}
        visible={config.company.visible}
        editable={editable}
        onMove={(x, y) => onUpdatePos?.('company', x, y)}
        onToggle={() => onToggleVisible?.('company')}
      >
        <p className="text-slate-500 font-medium text-[10px] truncate max-w-[180px]">{data.company}</p>
      </DraggableElement>

      <DraggableElement
        id="status"
        x={config.status.x}
        y={config.status.y}
        visible={config.status.visible}
        editable={editable}
        onMove={(x, y) => onUpdatePos?.('status', x, y)}
        onToggle={() => onToggleVisible?.('status')}
      >
        <div className={`px-2 py-0.5 rounded-full text-white font-bold uppercase tracking-wide text-[7px] ${
          data.status === "checked_in" ? "bg-emerald-500" : data.status === "registered" ? "bg-blue-500" : "bg-amber-500"
        }`}>
          {data.status.replace('_', ' ')}
        </div>
      </DraggableElement>

      <DraggableElement
        id="qr"
        x={config.qr.x}
        y={config.qr.y}
        visible={config.qr.visible}
        editable={editable}
        onMove={(x, y) => onUpdatePos?.('qr', x, y)}
        onToggle={() => onToggleVisible?.('qr')}
      >
        <div className="flex flex-col items-center gap-1 bg-white p-1 rounded-lg">
          <QRCodeSVG value={badgeUrl} size={64} level="M" />
          <p className="text-slate-400 font-bold text-[5px] uppercase tracking-tighter">Scan to Verify</p>
        </div>
      </DraggableElement>
    </div>
  );
}

function DraggableElement({ 
  id, x, y, visible, editable, children, onMove, onToggle 
}: { 
  id: string, x: number, y: number, visible: boolean, editable: boolean, children: React.ReactNode, onMove: (x: number, y: number) => void, onToggle: () => void 
}) {
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  if (!visible && !editable) return null;

  const onMouseDown = (e: React.MouseEvent) => {
    if (!editable) return;
    isDragging.current = true;
    startPos.current = { x: e.clientX - x, y: e.clientY - y };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    onMove(e.clientX - startPos.current.x, e.clientY - startPos.current.y);
  };

  const onMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        cursor: editable ? 'move' : 'default',
        opacity: !visible ? 0.3 : 1,
        zIndex: editable ? 100 : 1,
        userSelect: 'none'
      }}
      onMouseDown={onMouseDown}
      className={`group ${editable ? 'hover:ring-1 ring-blue-400 ring-offset-2 rounded' : ''}`}
    >
      {children}
      {editable && (
        <div className="absolute -top-5 left-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="p-1 bg-white shadow-sm border rounded text-slate-600 hover:text-blue-600">
            {visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          </button>
          <div className="px-1.5 py-0.5 bg-slate-900 text-white text-[8px] font-bold rounded flex items-center gap-1">
            <Move className="h-2 w-2" /> {id.toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
}
