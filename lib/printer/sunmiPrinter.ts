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
  method: "bridge" | "bluetooth" | "none" | null;
}

// Common Bluetooth GATT service UUIDs for ESC/POS Thermal Printers
const PRINTER_GATT_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb",
  "0000e7e0-0000-1000-8000-00805f9b34fb",
  "49535343-fe7d-4ae5-8fa9-9fafd205e455",
  "00001101-0000-1000-8000-00805f9b34fb",
  "0000ff00-0000-1000-8000-00805f9b34fb",
];

// Ambient types for Web Bluetooth API
interface WebBluetoothGATTCharacteristic {
  properties: {
    write?: boolean;
    writeWithoutResponse?: boolean;
  };
  writeValueWithResponse(value: BufferSource): Promise<void>;
  writeValueWithoutResponse(value: BufferSource): Promise<void>;
}

interface WebBluetoothDevice {
  name?: string;
  gatt?: {
    connected: boolean;
    connect(): Promise<WebBluetoothGATTServer>;
  };
  addEventListener(type: string, listener: EventListener): void;
}

interface WebBluetoothGATTServer {
  getPrimaryServices(): Promise<WebBluetoothGATTService[]>;
}

interface WebBluetoothGATTService {
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

class SunmiPrinterService {
  private listeners: ((state: PrinterConnectionState) => void)[] = [];
  private state: PrinterConnectionState = {
    status: "disconnected",
    deviceName: null,
    method: null,
  };

  private gattCharacteristic: WebBluetoothGATTCharacteristic | null = null;
  private gattDevice: WebBluetoothDevice | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      setTimeout(() => this.detect(), 300);
    }
  }

  private detect() {
    // 1. Native Sunmi SDK Bridge
    const bridge = this.getSdkBridge();
    if (bridge) {
      this.setState({
        status: "connected",
        deviceName: "Sunmi Hardware SDK",
        method: "bridge",
      });
      return;
    }

    // 2. Active Web Bluetooth GATT connection
    if (this.gattCharacteristic && this.gattDevice?.gatt?.connected) {
      this.setState({
        status: "connected",
        deviceName: this.gattDevice.name || "Thermal Bluetooth Printer",
        method: "bluetooth",
      });
      return;
    }

    // 3. Web Bluetooth API capability
    const hasWebBluetooth = typeof navigator !== "undefined" && "bluetooth" in navigator;
    this.setState({
      status: "disconnected",
      deviceName: null,
      method: hasWebBluetooth ? null : "none",
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

  public isReady(): boolean {
    if (typeof window === "undefined") return false;
    return !!this.getSdkBridge() || !!this.gattCharacteristic || ("bluetooth" in navigator);
  }

  /**
   * Prompts the browser's native Bluetooth pairing dialog to pair with the thermal printer.
   */
  public async connectBluetooth(): Promise<boolean> {
    if (typeof navigator === "undefined" || !navigator.bluetooth) {
      alert("Web Bluetooth is not supported in this browser. Please use Chrome on Android.");
      return false;
    }

    try {
      console.log("[SunmiPrinter] Requesting Web Bluetooth printer device...");
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_GATT_SERVICES,
      });

      console.log("[SunmiPrinter] Bluetooth device selected:", device.name);
      this.gattDevice = device;

      device.addEventListener("gattserverdisconnected", () => {
        console.warn("[SunmiPrinter] Bluetooth GATT server disconnected");
        this.gattCharacteristic = null;
        this.detect();
      });

      const server = await device.gatt?.connect();
      if (!server) throw new Error("Could not connect to GATT server");

      let writeChar: WebBluetoothGATTCharacteristic | null = null;
      const services = await server.getPrimaryServices();

      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            writeChar = char;
            break;
          }
        }
        if (writeChar) break;
      }

      if (!writeChar) {
        throw new Error("No writable Bluetooth GATT characteristic found on printer.");
      }

      this.gattCharacteristic = writeChar;
      this.setState({
        status: "connected",
        deviceName: device.name || "Inner Thermal Printer",
        method: "bluetooth",
      });

      console.log("[SunmiPrinter] Web Bluetooth connected successfully!");
      return true;
    } catch (err: any) {
      console.error("[SunmiPrinter] Web Bluetooth pairing error:", err);
      return false;
    }
  }

  public async printTicket(ticket: TicketData): Promise<void> {
    // 1. Native Sunmi SDK Bridge (if on Sunmi OS runtime)
    const sdkBridge = this.getSdkBridge();
    if (sdkBridge) {
      console.log("[SunmiPrinter] Printing via Sunmi SDK Bridge");
      this.printViaSdkBridge(sdkBridge, ticket);
      return;
    }

    // 2. Active Web Bluetooth Connection
    if (this.gattCharacteristic) {
      console.log("[SunmiPrinter] Printing via Web Bluetooth GATT");
      await this.printViaBluetooth(ticket);
      return;
    }

    // 3. Prompt user to connect Bluetooth if not connected
    console.log("[SunmiPrinter] Bluetooth not connected. Opening browser pairing selector...");
    const connected = await this.connectBluetooth();
    if (connected && this.gattCharacteristic) {
      await this.printViaBluetooth(ticket);
    }
  }

  private async printViaBluetooth(ticket: TicketData): Promise<void> {
    if (!this.gattCharacteristic) return;

    const bytes = this.buildEscPosBytes(ticket);
    const CHUNK_SIZE = 100; // Chunk size for reliable GATT writes

    try {
      for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
        const chunk = bytes.slice(i, i + CHUNK_SIZE);
        if (this.gattCharacteristic.properties.writeWithoutResponse) {
          await this.gattCharacteristic.writeValueWithoutResponse(chunk);
        } else {
          await this.gattCharacteristic.writeValueWithResponse(chunk);
        }
        await new Promise((res) => setTimeout(res, 20)); // Subtle delay between GATT chunks
      }
      console.log("[SunmiPrinter] Web Bluetooth print complete!");
    } catch (err) {
      console.error("[SunmiPrinter] Bluetooth write error:", err);
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

      console.log("[SunmiPrinter] Printed successfully via Sunmi SDK Bridge");
    } catch (err) {
      console.error("[SunmiPrinter] SDK Bridge print error:", err);
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
