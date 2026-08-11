"use client";

import { useEffect, useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, Printer, Move, Eye, EyeOff, LayoutDashboard, Settings2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sunmiPrinter } from "@/lib/printer/sunmiPrinter";

interface BadgeData {
  id: string;
  name: string;
  email: string;
  company: string;
  status: string;
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

export function BadgePrintClient({ id }: { id: string }) {
  const [data, setData] = useState<BadgeData | null>(null);
  const [error, setError] = useState("");
  const [isDesignMode, setIsDesignMode] = useState(false);
  const [config, setConfig] = useState<BadgeConfig>(DEFAULT_CONFIG);

  const handlePrint = () => {
    if (!data) return;
    sunmiPrinter.printTicket({
      id: data.id,
      name: data.name,
      email: data.email,
      company: data.company,
      status: data.status,
    });
  };

  useEffect(() => {
    fetch(`/api/badge/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
        if (!isDesignMode) {
          setTimeout(() => {
            sunmiPrinter.printTicket({
              id: d.id,
              name: d.name,
              email: d.email,
              company: d.company,
              status: d.status,
            });
          }, 800);
        }
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="p-6 bg-white rounded-2xl shadow-xl border border-red-100 text-center">
          <p className="text-destructive font-bold">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

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
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* 🛠️ Editor Toolbar (Screen only) */}
      <div className="print:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b shadow-sm z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-bold text-sm">
            <LayoutDashboard className="h-4 w-4" />
            Badge Designer
          </div>
          <div className="h-6 w-[1px] bg-slate-200 mx-2" />
          <Button 
            variant={isDesignMode ? "default" : "outline"} 
            onClick={() => setIsDesignMode(!isDesignMode)}
            className="gap-2 h-9"
          >
            {isDesignMode ? <Check className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
            {isDesignMode ? "Done Editing" : "Customize Layout"}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-xs text-slate-400 font-medium hidden md:block">
            {isDesignMode ? "Drag elements to move • Click eye to hide" : "Preview mode • Ready to print"}
          </p>
          <Button onClick={handlePrint} className="gap-2 bg-slate-900 hover:bg-slate-800 shadow-lg h-9">
            <Printer className="h-4 w-4" />
            Print Now
          </Button>
        </div>
      </div>

      {/* 📱 Preview Container */}
      <div className={`print:hidden pt-24 pb-12 flex flex-col items-center justify-center transition-all duration-300 ${isDesignMode ? 'bg-slate-200/50' : 'bg-slate-50'}`}>
        <div className="relative">
          {isDesignMode && (
             <div className="absolute -top-8 left-0 right-0 flex justify-center">
                <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-t-lg uppercase tracking-wider">
                  Editing Live
                </span>
             </div>
          )}
          <BadgeCard 
            data={data} 
            appName={appName} 
            badgeUrl={badgeUrl} 
            config={config}
            editable={isDesignMode}
            onUpdatePos={updatePos}
            onToggleVisible={toggleVisible}
          />
        </div>
        
        {!isDesignMode && (
          <p className="mt-8 text-slate-400 text-sm animate-pulse">
            Badge preview — looks exactly like the printout
          </p>
        )}
      </div>

      {/* 🖨️ Print Area (Hidden on screen) */}
      <div id="badge-print-area" className="hidden print:block">
        <BadgeCard 
          data={data} 
          appName={appName} 
          badgeUrl={badgeUrl} 
          config={config}
          print 
        />
      </div>

      <style>{`
        @media print {
          html, body { margin: 0; padding: 0; width: 58mm !important; background: white !important; }
          @page { size: 58mm auto; margin: 0; }
        }
      `}</style>
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
  data: BadgeData;
  appName: string;
  badgeUrl: string;
  config: BadgeConfig;
  print?: boolean;
  editable?: boolean;
  onUpdatePos?: (key: keyof BadgeConfig, x: number, y: number) => void;
  onToggleVisible?: (key: keyof BadgeConfig) => void;
}) {
  // Card size: 324 x 204 px (3.375 x 2.125 inches at 96 DPI)
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
        boxShadow: editable ? '0 0 0 2px #2563eb, 0 20px 25px -5px rgb(0 0 0 / 0.1)' : '0 20px 25px -5px rgb(0 0 0 / 0.1)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        transition: 'box-shadow 0.2s ease'
      };

  return (
    <div style={style}>
      {/* Background/Decor */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-blue-600" />
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-50" />

      {/* App Name */}
      <DraggableElement
        id="appName"
        x={config.appName.x}
        y={config.appName.y}
        visible={config.appName.visible}
        editable={editable}
        onMove={(x, y) => onUpdatePos?.('appName', x, y)}
        onToggle={() => onToggleVisible?.('appName')}
      >
        <p className="text-blue-600 font-bold uppercase tracking-[0.2em] text-[7px]">
          {appName}
        </p>
      </DraggableElement>

      {/* Attendee Name */}
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

      {/* Company */}
      <DraggableElement
        id="company"
        x={config.company.x}
        y={config.company.y}
        visible={config.company.visible}
        editable={editable}
        onMove={(x, y) => onUpdatePos?.('company', x, y)}
        onToggle={() => onToggleVisible?.('company')}
      >
        <p className="text-slate-500 font-medium text-[10px] truncate max-w-[180px]">
          {data.company || "Guest"}
        </p>
      </DraggableElement>

      {/* Status Badge */}
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

      {/* QR Code */}
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
          <button 
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className="p-1 bg-white shadow-sm border rounded text-slate-600 hover:text-blue-600"
          >
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
