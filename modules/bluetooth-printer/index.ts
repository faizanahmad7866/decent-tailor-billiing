import { requireOptionalNativeModule, type NativeModule } from 'expo';

/** A Bluetooth device the phone is paired with or has just found nearby. */
export interface BluetoothDevice {
  name: string;
  address: string;
  /** Says it is a printer (its class, its services or its name). Sorting only. */
  isPrinter: boolean;
  /** Paired in the phone's Bluetooth settings. */
  paired: boolean;
  /** How it talks: classic (SPP), BLE, both, or not known yet. */
  kind: 'classic' | 'ble' | 'dual' | 'unknown';
}

type Events = {
  onDeviceFound: (device: BluetoothDevice) => void;
  onScanFinished: () => void;
};

/**
 * The native side (android/…/BluetoothPrinterModule.kt). Errors carry a
 * `code`: NO_BLUETOOTH, BLUETOOTH_OFF, PERMISSION_DENIED, CONNECT_FAILED,
 * NOT_CONNECTED, WRITE_FAILED.
 */
declare class BluetoothPrinterNative extends NativeModule<Events> {
  isAvailable(): boolean;
  isEnabled(): boolean;
  connectedAddress(): string | null;
  /** How the open connection reaches the printer, or null. */
  connectionKind(): 'classic' | 'ble' | null;
  pairedDevices(): Promise<BluetoothDevice[]>;
  /** Searches for `durationMs`; results arrive as events. */
  startScan(durationMs: number): Promise<void>;
  stopScan(): Promise<void>;
  /** Opens a connection (pairing first if Android asks for it). */
  connect(address: string): Promise<void>;
  /**
   * Prints a job: `blocks` (base64) one at a time, each sent no faster than
   * `bytesPerSecond`, and each followed by its `waitsMs` — the time printing
   * it takes — before the next.
   */
  print(
    blocks: string[],
    waitsMs: number[],
    bytesPerSecond: number
  ): Promise<void>;
  disconnect(): Promise<void>;
}

/**
 * Null where the module isn't in the installed app — on iOS, or on an
 * Android build made before printing was added — so screens can say so
 * rather than crash on import.
 */
export const BluetoothPrinter =
  requireOptionalNativeModule<BluetoothPrinterNative>('BluetoothPrinter');
