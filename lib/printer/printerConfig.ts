export interface ThermalPrinterConfig {
  // Device & Paper settings
  paperWidth: "80mm" | "58mm";
  deviceModel: "Sunmi V2s Plus" | "Generic Thermal";
  autoCut: boolean;

  // Typography & Styling
  fontFamily: string;
  titleFontSize: string; // e.g., '18px'
  headerFontSize: string; // e.g., '14px'
  bodyFontSize: string; // e.g., '12px'
  footerFontSize: string; // e.g., '10px'
  fontWeightBold: number; // 700
  letterSpacing: string;

  // Layout & Components
  showLogo: boolean;
  logoUrl?: string;
  headerTitle: string;
  headerSubtitle: string;
  showQRCode: boolean;
  qrCodeSize: number;
  dividerStyle: "dashed" | "solid" | "double" | "dotted";
  
  // Custom Footer
  footerText: string;
  showTimestamp: boolean;
}

export const DEFAULT_SUNMI_V2S_CONFIG: ThermalPrinterConfig = {
  paperWidth: "58mm",
  deviceModel: "Sunmi V2s Plus",
  autoCut: false,

  // Typography (optimized for Sunmi 203dpi thermal head)
  fontFamily: "'Courier New', Courier, monospace",
  titleFontSize: "20px",
  headerFontSize: "14px",
  bodyFontSize: "12px",
  footerFontSize: "10px",
  fontWeightBold: 700,
  letterSpacing: "0.5px",

  // Layout
  showLogo: true,
  headerTitle: "EVENT TICKET",
  headerSubtitle: "Official Access Pass",
  showQRCode: true,
  qrCodeSize: 110,
  dividerStyle: "dashed",

  // Footer
  footerText: "Thank you! Please present this ticket at entry.",
  showTimestamp: true,
};
