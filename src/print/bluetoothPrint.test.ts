import { BluetoothPrinter } from '../../modules/bluetooth-printer';
import {
  connectPrinter,
  describeProblem,
  pairedPrinters,
  PrinterError,
  searchForPrinters,
  sendToPrinter,
  toPrinterError,
  type BluetoothDevice,
  type PrintStage,
} from './bluetoothPrint';

jest.mock('../../modules/bluetooth-printer', () => ({
  BluetoothPrinter: {
    connectedAddress: jest.fn(),
    pairedDevices: jest.fn(),
    connect: jest.fn(),
    print: jest.fn(),
    startScan: jest.fn(),
    stopScan: jest.fn(),
    addListener: jest.fn(),
  },
}));

const printer = BluetoothPrinter as unknown as Record<string, jest.Mock>;
const ADDRESS = '66:22:01:AA:BB:CC';
// Two blocks: 24 rows, then 120 (the feed).
const JOB = [
  { bytes: Uint8Array.of(0x1b, 0x40), rows: 24 },
  { bytes: Uint8Array.of(0x1b, 0x64, 4), rows: 120 },
];
const PACE = { bytesPerSecond: 11000, rowsPerSecond: 300 };

const nativeError = (code: string): Error =>
  Object.assign(new Error(code), { code });

const device = (
  name: string,
  isPrinter: boolean,
  address = ADDRESS
): BluetoothDevice => ({
  name,
  address,
  isPrinter,
  paired: true,
  kind: 'classic',
});

beforeEach(() => {
  jest.useFakeTimers();
  for (const fn of Object.values(printer)) fn.mockReset();
  printer.connectedAddress.mockReturnValue(null);
  printer.connect.mockResolvedValue(undefined);
  printer.print.mockResolvedValue(undefined);
  printer.startScan.mockResolvedValue(undefined);
  printer.stopScan.mockResolvedValue(undefined);
});

afterEach(() => jest.useRealTimers());

// Runs a print to the end, letting the retry pause pass.
async function print(onStage?: (stage: PrintStage) => void): Promise<void> {
  const done = sendToPrinter(ADDRESS, JOB, PACE, onStage);
  done.catch(() => {});
  await jest.runAllTimersAsync();
  return done;
}

describe('sendToPrinter', () => {
  it('connects, then sends the job block by block', async () => {
    const stages: PrintStage[] = [];
    await print((stage) => stages.push(stage));
    expect(printer.connect).toHaveBeenCalledWith(ADDRESS);
    // Each block base64, with the time its rows take at 300 rows a second.
    expect(printer.print).toHaveBeenCalledWith(
      ['G0A=', 'G2QE'],
      [80, 400],
      11000
    );
    expect(stages).toEqual(['connecting', 'printing']);
  });

  it('tries the connection a second time before giving up', async () => {
    printer.connect.mockRejectedValueOnce(nativeError('CONNECT_FAILED'));
    await print();
    expect(printer.connect).toHaveBeenCalledTimes(2);
    expect(printer.print).toHaveBeenCalledTimes(1);
  });

  it('does not try again when the printer took long to fail (it is off)', async () => {
    printer.connect.mockImplementationOnce(async () => {
      jest.setSystemTime(Date.now() + 10000);
      throw nativeError('CONNECT_FAILED');
    });
    await expect(print()).rejects.toMatchObject({ problem: 'connect' });
    expect(printer.connect).toHaveBeenCalledTimes(1);
  });

  it('says the printer could not be reached when both tries fail', async () => {
    printer.connect.mockRejectedValue(nativeError('CONNECT_FAILED'));
    await expect(print()).rejects.toEqual(new PrinterError('connect'));
    expect(printer.print).not.toHaveBeenCalled();
  });

  it('reopens a kept connection that died, and prints once more', async () => {
    printer.connectedAddress.mockReturnValue(ADDRESS);
    printer.print.mockRejectedValueOnce(nativeError('WRITE_FAILED'));
    await print();
    expect(printer.print).toHaveBeenCalledTimes(2);
  });

  it('does not print twice over a fresh connection', async () => {
    printer.print.mockRejectedValue(nativeError('WRITE_FAILED'));
    const failure = print();
    await expect(failure).rejects.toMatchObject({ problem: 'lost' });
    expect(printer.print).toHaveBeenCalledTimes(1);
  });
});

describe('pairedPrinters', () => {
  it('lists what the phone has paired, printers first', async () => {
    const earbuds = device('Buds', false, 'AA:00:00:00:00:01');
    const ezo = device('EZO-58', true);
    printer.pairedDevices.mockResolvedValue([earbuds, ezo]);
    await expect(pairedPrinters()).resolves.toEqual([ezo, earbuds]);
  });

  it('says so when Bluetooth is off', async () => {
    printer.pairedDevices.mockRejectedValue(nativeError('BLUETOOTH_OFF'));
    await expect(pairedPrinters()).rejects.toMatchObject({
      problem: 'bluetooth-off',
    });
  });
});

describe('searchForPrinters', () => {
  // The listeners the search registers, by event name.
  const listeners: Record<string, (...args: unknown[]) => void> = {};
  const removed: string[] = [];

  beforeEach(() => {
    removed.length = 0;
    printer.addListener.mockImplementation((event: string, listener) => {
      listeners[event] = listener;
      return { remove: () => removed.push(event) };
    });
  });

  it('reports each device found, then the end of the search', async () => {
    const found: BluetoothDevice[] = [];
    const onFinished = jest.fn();
    await searchForPrinters((d) => found.push(d), onFinished);
    expect(printer.startScan).toHaveBeenCalled();

    listeners.onDeviceFound(device('EZO-58', true));
    listeners.onScanFinished();
    expect(found).toEqual([device('EZO-58', true)]);
    expect(onFinished).toHaveBeenCalled();
    expect(removed.sort()).toEqual(['onDeviceFound', 'onScanFinished']);
  });

  it('can be stopped early', async () => {
    const stop = await searchForPrinters(jest.fn(), jest.fn());
    stop();
    expect(printer.stopScan).toHaveBeenCalled();
    expect(removed).toHaveLength(2);
  });

  it('lets go of its listeners when the search cannot start', async () => {
    printer.startScan.mockRejectedValue(nativeError('BLUETOOTH_OFF'));
    await expect(searchForPrinters(jest.fn(), jest.fn())).rejects.toMatchObject(
      { problem: 'bluetooth-off' }
    );
    expect(removed).toHaveLength(2);
  });
});

describe('connectPrinter', () => {
  it('opens the connection ahead of printing', async () => {
    await connectPrinter(ADDRESS);
    expect(printer.connect).toHaveBeenCalledWith(ADDRESS);
    expect(printer.print).not.toHaveBeenCalled();
  });
});

describe('toPrinterError', () => {
  it('names each native failure, and anything else as failed', () => {
    expect(toPrinterError(nativeError('NO_BLUETOOTH')).problem).toBe(
      'no-bluetooth'
    );
    expect(toPrinterError(nativeError('PERMISSION_DENIED')).problem).toBe(
      'permission'
    );
    expect(toPrinterError(nativeError('NOT_CONNECTED')).problem).toBe('lost');
    expect(toPrinterError(new Error('boom')).problem).toBe('failed');
    expect(toPrinterError(null).problem).toBe('failed');
  });
});

describe('describeProblem', () => {
  it('names the printer it could not reach', () => {
    expect(describeProblem('connect', 'EZO-58').title).toBe(
      "Couldn't reach EZO-58"
    );
    expect(describeProblem('connect', ' ').title).toBe(
      "Couldn't reach the printer"
    );
  });
});
