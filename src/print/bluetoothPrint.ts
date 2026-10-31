import {
  Linking,
  PermissionsAndroid,
  Platform,
  type Permission,
} from 'react-native';
import {
  BluetoothPrinter,
  type BluetoothDevice,
} from '../../modules/bluetooth-printer';
import { t } from '../i18n/t';
import { bytesToBase64, type PrintBlock } from './escpos';

// Talking to the shop's Bluetooth printer: the permissions Android asks for,
// finding the printer, the connection, and every way that can go wrong put
// into words the tailor can act on. What is printed is decided elsewhere
// (receiptText.ts, escpos.ts).

export type { BluetoothDevice };

export type PrintProblem =
  | 'unsupported'
  | 'no-bluetooth'
  | 'bluetooth-off'
  | 'permission'
  | 'permission-blocked'
  | 'connect'
  | 'lost'
  | 'failed';

export class PrinterError extends Error {
  constructor(readonly problem: PrintProblem) {
    super(problem);
    this.name = 'PrinterError';
  }
}

export type PrintStage = 'connecting' | 'printing';

// Right after a printer is switched on — or just paired — it can refuse the
// first connection; a second try a moment later almost always goes through.
const CONNECT_RETRY_MS = 1000;
const QUICK_FAILURE_MS = 4000;

// How long a search for nearby printers runs. Classic discovery takes about
// 12 seconds to go round once.
const SEARCH_MS = 15000;

// Android 12 brought "Nearby devices"; before it, searching needed Location.
const NEARBY_PERMISSION =
  Platform.OS === 'android' && (Platform.Version as number) >= 31;
const PERMISSION_NAME = NEARBY_PERMISSION ? '"Nearby devices"' : '"Location"';

const NATIVE_PROBLEMS: Record<string, PrintProblem> = {
  NO_BLUETOOTH: 'no-bluetooth',
  BLUETOOTH_OFF: 'bluetooth-off',
  PERMISSION_DENIED: 'permission',
  CONNECT_FAILED: 'connect',
  NOT_CONNECTED: 'lost',
  WRITE_FAILED: 'lost',
};

const codeOf = (error: unknown): string | undefined =>
  (error as { code?: string } | null)?.code;

export function toPrinterError(error: unknown): PrinterError {
  if (error instanceof PrinterError) return error;
  return new PrinterError(NATIVE_PROBLEMS[codeOf(error) ?? ''] ?? 'failed');
}

/** What went wrong, for the tailor: a title, and what to do about it. */
export function describeProblem(
  problem: PrintProblem,
  printerName: string
): { title: string; message: string } {
  const printer = printerName.trim() || t('the printer');
  switch (problem) {
    case 'unsupported':
      return {
        title: t('Printing not in this app'),
        message: t(
          'This copy of DT Billing was built without Bluetooth printing. Install the latest build to print.'
        ),
      };
    case 'no-bluetooth':
      return {
        title: t('No Bluetooth'),
        message: t(
          'This phone has no Bluetooth, so it cannot reach a printer.'
        ),
      };
    case 'bluetooth-off':
      return {
        title: t('Bluetooth is off'),
        message: t('Turn on Bluetooth to print.'),
      };
    case 'permission':
      return {
        title: t('Permission needed'),
        message: t(
          'DT Billing needs the {0} permission to find and use the printer.',
          PERMISSION_NAME
        ),
      };
    case 'permission-blocked':
      return {
        title: t('Permission needed'),
        message: t(
          'Printing needs the {0} permission. Turn it on for DT Billing in the app settings.',
          PERMISSION_NAME
        ),
      };
    case 'connect':
      return {
        title: t("Couldn't reach {0}", printer),
        message: t(
          'Check that the printer is switched on, has paper and is near the phone, then try again.'
        ),
      };
    case 'lost':
      return {
        title: t('Printing stopped'),
        message: t(
          '{0} stopped answering while printing. Check it is on and has paper, then print again.',
          printer
        ),
      };
    case 'failed':
      return {
        title: t('Could not print'),
        message: t('Something went wrong while printing. Try again.'),
      };
  }
}

function native(): NonNullable<typeof BluetoothPrinter> {
  if (!BluetoothPrinter) throw new PrinterError('unsupported');
  return BluetoothPrinter;
}

type Need = 'connect' | 'search';

// What each step needs. Android 12+: "Nearby devices" (connect, and scan to
// search). Android 11 and older: connecting needs nothing, searching needs
// Location — Android's rule, since a search could reveal where the phone is.
function permissionsFor(need: Need): Permission[] {
  if (Platform.OS !== 'android') return [];
  const { BLUETOOTH_CONNECT, BLUETOOTH_SCAN, ACCESS_FINE_LOCATION } =
    PermissionsAndroid.PERMISSIONS;
  if (NEARBY_PERMISSION) {
    return need === 'search'
      ? [BLUETOOTH_SCAN, BLUETOOTH_CONNECT]
      : [BLUETOOTH_CONNECT];
  }
  return need === 'search' ? [ACCESS_FINE_LOCATION] : [];
}

async function ensurePermission(need: Need): Promise<void> {
  const wanted = permissionsFor(need);
  if (!wanted.length) return;
  // Asks only for what isn't granted yet; granted ones come straight back.
  const answers = await PermissionsAndroid.requestMultiple(wanted);
  const refused = wanted.map((permission) => answers[permission]);
  if (
    refused.every((answer) => answer === PermissionsAndroid.RESULTS.GRANTED)
  ) {
    return;
  }
  throw new PrinterError(
    refused.includes(PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN)
      ? 'permission-blocked'
      : 'permission'
  );
}

const pause = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const printersFirst = (a: BluetoothDevice, b: BluetoothDevice): number =>
  Number(b.isPrinter) - Number(a.isPrinter);

/** The devices paired with this phone, printers first. */
export async function pairedPrinters(): Promise<BluetoothDevice[]> {
  try {
    const printer = native();
    await ensurePermission('connect');
    return (await printer.pairedDevices()).sort(printersFirst);
  } catch (error) {
    throw toPrinterError(error);
  }
}

/**
 * Searches for printers nearby — paired or not, classic Bluetooth or BLE —
 * calling `onFound` for each device as it turns up and `onFinished` when the
 * search ends. Resolves with a function that stops the search early.
 */
export async function searchForPrinters(
  onFound: (device: BluetoothDevice) => void,
  onFinished: () => void
): Promise<() => void> {
  try {
    const printer = native();
    await ensurePermission('search');
    const found = printer.addListener('onDeviceFound', onFound);
    const finished = printer.addListener('onScanFinished', () => {
      found.remove();
      finished.remove();
      onFinished();
    });
    try {
      await printer.startScan(SEARCH_MS);
    } catch (error) {
      found.remove();
      finished.remove();
      throw error;
    }
    return () => {
      found.remove();
      finished.remove();
      printer.stopScan().catch(() => {});
    };
  } catch (error) {
    throw toPrinterError(error);
  }
}

async function connect(address: string): Promise<void> {
  const printer = native();
  const started = Date.now();
  try {
    await printer.connect(address);
  } catch (error) {
    // A quick refusal is a printer that is there but not ready; a slow one
    // is a printer that isn't there, and asking again would only double
    // the wait.
    const quick = Date.now() - started < QUICK_FAILURE_MS;
    if (codeOf(error) !== 'CONNECT_FAILED' || !quick) throw error;
    await pause(CONNECT_RETRY_MS);
    await printer.connect(address);
  }
}

/**
 * Opens the connection to a printer ahead of printing, so Print starts at
 * once. A printer found nearby but not paired yet is paired on the way:
 * Android shows its own pairing prompt.
 */
export async function connectPrinter(address: string): Promise<void> {
  try {
    await ensurePermission('connect');
    await connect(address);
  } catch (error) {
    throw toPrinterError(error);
  }
}

/**
 * How fast a job goes to a printer: bytes a second while a block is sent,
 * and dot rows a second the printer is reckoned to print, which sizes the
 * wait after each block for a printer that can't confirm it.
 */
export interface Pace {
  bytesPerSecond: number;
  rowsPerSecond: number;
}

/**
 * Prints a job on the printer at `address`. The connection is kept open
 * afterwards, so the next print starts at once; if that kept connection
 * turns out to have died in between (the printer was switched off and on),
 * it is opened afresh and the job sent once more — nothing reached the
 * paper the first time.
 */
export async function sendToPrinter(
  address: string,
  job: PrintBlock[],
  pace: Pace,
  onStage?: (stage: PrintStage) => void
): Promise<void> {
  try {
    const printer = native();
    await ensurePermission('connect');
    const blocks = job.map((block) => bytesToBase64(block.bytes));
    const waits = job.map((block) =>
      Math.ceil((block.rows / pace.rowsPerSecond) * 1000)
    );
    const reused = printer.connectedAddress() === address;

    onStage?.('connecting');
    await connect(address);
    onStage?.('printing');
    try {
      await printer.print(blocks, waits, pace.bytesPerSecond);
    } catch (error) {
      if (!reused || NATIVE_PROBLEMS[codeOf(error) ?? ''] !== 'lost') {
        throw error;
      }
      onStage?.('connecting');
      await connect(address);
      onStage?.('printing');
      await printer.print(blocks, waits, pace.bytesPerSecond);
    }
  } catch (error) {
    throw toPrinterError(error);
  }
}

/** How the open connection reaches the printer: classic or BLE. */
export function connectionKind(): 'classic' | 'ble' | null {
  return BluetoothPrinter?.connectionKind() ?? null;
}

/** Where printers are paired: the phone's Bluetooth settings. */
export function openBluetoothSettings(): Promise<void> {
  return Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS');
}

/**
 * Asks Android to switch Bluetooth on (its own "Allow?" dialog), or opens the
 * Bluetooth settings where a phone doesn't offer that.
 */
export async function turnOnBluetooth(): Promise<void> {
  try {
    await ensurePermission('connect');
    await Linking.sendIntent('android.bluetooth.adapter.action.REQUEST_ENABLE');
  } catch {
    await openBluetoothSettings();
  }
}
