export interface TicketData {
  id: string;
  name: string;
  email: string;
  ticketType?: string;
  company?: string;
  eventName?: string;
  eventDate?: string;
  eventVenue?: string;
  price?: string | number;
  status?: string;
  verifyUrl?: string;
}

export type PrinterConnectionStatus = "disconnected" | "connected" | "unavailable";

export interface PrinterConnectionState {
  status: PrinterConnectionStatus;
  deviceName: string | null;
  method: "bridge" | "bluetooth" | "saved" | "none" | null;
  error?: string | null;
}

// Common Bluetooth GATT service & characteristic UUIDs for ESC/POS Thermal Printers
const PRINTER_GATT_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb",
  "0000e7e0-0000-1000-8000-00805f9b34fb",
  "49535343-fe7d-4ae5-8fa9-9fafd205e455",
  "00001101-0000-1000-8000-00805f9b34fb",
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "0000180a-0000-1000-8000-00805f9b34fb",
];

interface WebBluetoothGATTCharacteristic {
  uuid?: string;
  properties: {
    write?: boolean;
    writeWithoutResponse?: boolean;
  };
  writeValueWithResponse(value: BufferSource): Promise<void>;
  writeValueWithoutResponse(value: BufferSource): Promise<void>;
}

interface WebBluetoothDevice {
  name?: string;
  id?: string;
  gatt?: {
    connected: boolean;
    connect(): Promise<WebBluetoothGATTServer>;
    disconnect(): void;
  };
  addEventListener(type: string, listener: EventListener): void;
}

interface WebBluetoothGATTServer {
  getPrimaryService(service: string): Promise<WebBluetoothGATTService>;
  getPrimaryServices(): Promise<WebBluetoothGATTService[]>;
}

interface WebBluetoothGATTService {
  uuid?: string;
  getCharacteristics(): Promise<WebBluetoothGATTCharacteristic[]>;
}

declare global {
  interface Navigator {
    bluetooth?: {
      requestDevice(options: {
        acceptAllDevices?: boolean;
        optionalServices?: string[];
      }): Promise<WebBluetoothDevice>;
    };
  }

  interface Window {
    SunmiInnerPrinter?: {
      printerInit: () => void;
      printText: (text: string) => void;
      setAlignment: (align: number) => void;
      setFontSize: (size: number) => void;
      setBold: (enable: boolean) => void;
      lineWrap: (lines: number) => void;
      printQRCode: (data: string, moduleSize: number, errorLevel: number) => void;
    };
    PrinterPlugin?: Window["SunmiInnerPrinter"];
    sunmiInnerPrinter?: Window["SunmiInnerPrinter"];
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(errorMessage));
    }, ms);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

const STORAGE_KEY_PAIRED = "eventflow_printer_paired";
const STORAGE_KEY_NAME = "eventflow_printer_name";

class SunmiPrinterService {
  private listeners: ((state: PrinterConnectionState) => void)[] = [];
  private state: PrinterConnectionState = {
    status: "disconnected",
    deviceName: null,
    method: null,
    error: null,
  };

  private gattCharacteristic: WebBluetoothGATTCharacteristic | null = null;
  private gattDevice: WebBluetoothDevice | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      setTimeout(() => this.detect(), 200);
    }
  }

  private detect() {
    if (typeof window === "undefined") return;

    // 1. Native Sunmi SDK Bridge (if present)
    const bridge = this.getSdkBridge();
    if (bridge) {
      this.setState({
        status: "connected",
        deviceName: "Sunmi Hardware Printer",
        method: "bridge",
        error: null,
      });
      return;
    }

    // 2. Active Web Bluetooth GATT connection
    if (this.gattCharacteristic && this.gattDevice?.gatt?.connected) {
      this.setState({
        status: "connected",
        deviceName: this.gattDevice.name || "Thermal Bluetooth Printer",
        method: "bluetooth",
        error: null,
      });
      return;
    }

    // 3. Saved Printer in LocalStorage (Never Forget Mode)
    const isSaved = localStorage.getItem(STORAGE_KEY_PAIRED) === "true";
    const savedName = localStorage.getItem(STORAGE_KEY_NAME) || "Sunmi POS Printer";

    if (isSaved) {
      this.setState({
        status: "connected",
        deviceName: savedName,
        method: "saved",
        error: null,
      });
      return;
    }

    // 4. Default Disconnected
    this.setState({
      status: "disconnected",
      deviceName: null,
      method: null,
      error: null,
    });
  }

  private getSdkBridge() {
    if (typeof window === "undefined") return null;
    return window.SunmiInnerPrinter || window.PrinterPlugin || window.sunmiInnerPrinter || null;
  }

  private setState(newState: PrinterConnectionState) {
    this.state = newState;
    this.listeners.forEach((l) => l(this.state));
  }

  public getState(): PrinterConnectionState {
    return this.state;
  }

  public subscribe(listener: (state: PrinterConnectionState) => void): () => void {
    this.listeners.push(listener);
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public reconnect() {
    this.detect();
  }

  /**
   * Save printer connection permanently so Sunmi POS never forgets it.
   */
  public savePrinterPreference(deviceName: string = "Sunmi POS Built-in Printer") {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_PAIRED, "true");
      localStorage.setItem(STORAGE_KEY_NAME, deviceName);
      this.detect();
    }
  }

  /**
   * Forget saved printer.
   */
  public forgetPrinter() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY_PAIRED);
      localStorage.removeItem(STORAGE_KEY_NAME);
      this.gattCharacteristic = null;
      if (this.gattDevice?.gatt?.connected) {
        try {
          this.gattDevice.gatt.disconnect();
        } catch {
          // ignore
        }
      }
      this.detect();
    }
  }

  /**
   * Prompts pairing / auto-connects and saves preference permanently.
   */
  public async connectBluetooth(): Promise<boolean> {
    // Save Sunmi POS preference immediately so user is connected forever
    this.savePrinterPreference("Sunmi POS Thermal Printer");

    if (typeof navigator !== "undefined" && navigator.bluetooth) {
      try {
        console.log("[SunmiPrinter] Requesting Web Bluetooth printer device...");
        const device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: PRINTER_GATT_SERVICES,
        });

        if (device) {
          const devName = device.name || "Sunmi Bluetooth Printer";
          this.gattDevice = device;
          this.savePrinterPreference(devName);

          device.addEventListener("gattserverdisconnected", () => {
            console.warn("[SunmiPrinter] Bluetooth GATT disconnected");
            this.gattCharacteristic = null;
            this.detect();
          });

          console.log("[SunmiPrinter] Connecting to GATT Server...");
          const server = await withTimeout(
            device.gatt?.connect() as Promise<WebBluetoothGATTServer>,
            6000,
            "GATT connection timeout"
          );

          if (server) {
            for (const serviceUuid of PRINTER_GATT_SERVICES) {
              try {
                const service = await server.getPrimaryService(serviceUuid);
                const chars = await service.getCharacteristics();
                for (const c of chars) {
                  if (c.properties.write || c.properties.writeWithoutResponse) {
                    this.gattCharacteristic = c;
                    break;
                  }
                }
              } catch {
                // proceed
              }
              if (this.gattCharacteristic) break;
            }
          }
        }
      } catch (err: any) {
        console.warn("[SunmiPrinter] Bluetooth GATT pairing skipped/fallback:", err);
      }
    }

    // Always ensure printer is marked as connected permanently!
    this.savePrinterPreference("Sunmi POS Thermal Printer");
    return true;
  }

  public async printTicket(ticket: TicketData): Promise<void> {
    // 1. Native Sunmi SDK Bridge
    const sdkBridge = this.getSdkBridge();
    if (sdkBridge) {
      console.log("[SunmiPrinter] Printing via Sunmi SDK Bridge");
      this.printViaSdkBridge(sdkBridge, ticket);
      return;
    }

    // 2. Web Bluetooth Connection (if GATT write characteristic is present)
    if (this.gattCharacteristic && this.gattDevice?.gatt?.connected) {
      console.log("[SunmiPrinter] Printing via Web Bluetooth GATT");
      await this.printViaBluetooth(ticket);
      return;
    }

    // 3. Instant 58mm Thermal Print via Sunmi Chrome Browser
    console.log("[SunmiPrinter] Executing instant Sunmi thermal print...");
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  private async printViaBluetooth(ticket: TicketData): Promise<void> {
    if (!this.gattCharacteristic) return;

    const bytes = this.buildEscPosBytes(ticket);
    const CHUNK_SIZE = 80;

    try {
      for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
        const chunk = bytes.slice(i, i + CHUNK_SIZE);
        if (this.gattCharacteristic.properties.writeWithoutResponse) {
          await this.gattCharacteristic.writeValueWithoutResponse(chunk);
        } else {
          await this.gattCharacteristic.writeValueWithResponse(chunk);
        }
        await new Promise((res) => setTimeout(res, 25));
      }
      console.log("[SunmiPrinter] Web Bluetooth print complete!");
    } catch (err) {
      console.error("[SunmiPrinter] Bluetooth write error:", err);
      if (typeof window !== "undefined") {
        window.print();
      }
    }
  }

  private printViaSdkBridge(
    printer: NonNullable<Window["SunmiInnerPrinter"]>,
    ticket: TicketData
  ): void {
    const appName = ticket.eventName || process.env.NEXT_PUBLIC_APP_NAME || "EventFlow";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const verifyUrl = ticket.verifyUrl || `${origin}/verify/${ticket.id}`;

    try {
      printer.printerInit();
      printer.setAlignment(1);
      printer.setBold(true);
      printer.setFontSize(28);
      printer.printText(`${appName.toUpperCase()}\n`);
      printer.setFontSize(22);
      printer.printText(`EVENT REGISTRATION PASS\n`);
      printer.setBold(false);
      printer.setFontSize(18);
      printer.printText(`================================\n\n`);

      printer.setAlignment(0);
      printer.printText(`ATTENDEE:\n`);
      printer.setBold(true);
      printer.setFontSize(24);
      printer.printText(`${ticket.name.toUpperCase()}\n`);
      printer.setBold(false);
      printer.setFontSize(18);
      printer.printText(`Email: ${ticket.email}\n`);
      if (ticket.ticketType) printer.printText(`PASS TYPE: ${ticket.ticketType.toUpperCase()}\n`);
      if (ticket.company) printer.printText(`ORG: ${ticket.company.toUpperCase()}\n`);
      if (ticket.status) printer.printText(`STATUS: ${ticket.status.replace(/_/g, " ").toUpperCase()}\n`);
      if (ticket.price !== undefined) printer.printText(`AMOUNT: $${ticket.price}\n`);
      printer.printText(`--------------------------------\n`);
      printer.printText(`TICKET ID: ${ticket.id}\n`);
      printer.printText(`--------------------------------\n\n`);

      printer.setAlignment(1);
      printer.printQRCode(verifyUrl, 8, 1);
      printer.lineWrap(1);
      printer.printText(`Scan to verify\n`);
      printer.printText(`${new Date().toLocaleString()}\n`);
      printer.lineWrap(5);
    } catch (err) {
      console.error("[SunmiPrinter] SDK Bridge print error:", err);
      if (typeof window !== "undefined") window.print();
    }
  }

  private buildEscPosBytes(ticket: TicketData): Uint8Array {
    const enc = new TextEncoder();
    const parts: Uint8Array[] = [];
    const b = (bytes: number[]) => parts.push(new Uint8Array(bytes));
    const t = (str: string) => parts.push(enc.encode(str));

    const appName = ticket.eventName || process.env.NEXT_PUBLIC_APP_NAME || "EventFlow";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const verifyUrl = ticket.verifyUrl || `${origin}/verify/${ticket.id}`;

    b([0x1b, 0x40]);           // ESC @ (init)
    b([0x1b, 0x61, 0x01]);    // center align
    b([0x1d, 0x21, 0x11]);    // double height & width
    t(`${appName.toUpperCase()}\n`);
    b([0x1d, 0x21, 0x00]);    // normal size
    t(`EVENT REGISTRATION PASS\n`);
    t(`================================\n\n`);

    b([0x1b, 0x61, 0x00]);    // left align
    t(`ATTENDEE:\n`);
    b([0x1b, 0x45, 0x01]);    // bold on
    t(`${ticket.name.toUpperCase()}\n`);
    b([0x1b, 0x45, 0x00]);    // bold off
    t(`Email: ${ticket.email}\n`);
    if (ticket.ticketType) t(`PASS TYPE: ${ticket.ticketType.toUpperCase()}\n`);
    if (ticket.company) t(`ORG: ${ticket.company.toUpperCase()}\n`);
    if (ticket.status) t(`STATUS: ${ticket.status.replace(/_/g, " ").toUpperCase()}\n`);
    if (ticket.price !== undefined) t(`AMOUNT: $${ticket.price}\n`);
    t(`--------------------------------\n`);
    t(`TICKET ID: ${ticket.id}\n`);
    t(`--------------------------------\n\n`);

    b([0x1b, 0x61, 0x01]);    // center align
    t(`VERIFY:\n${verifyUrl}\n\n`);
    t(`${new Date().toLocaleString()}\n`);
    t(`================================\n`);
    b([0x1b, 0x64, 0x06]);   // feed 6 lines for manual tear bar

    let len = 0;
    for (const p of parts) len += p.length;
    const out = new Uint8Array(len);
    let off = 0;
    for (const p of parts) { out.set(p, off); off += p.length; }
    return out;
  }
}

export const sunmiPrinter = new SunmiPrinterService();
