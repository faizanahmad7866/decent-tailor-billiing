import { useCallback, useEffect, useRef, useState } from 'react';
import {
  connectPrinter,
  toPrinterError,
  type BluetoothDevice,
  type PrintProblem,
} from '../print/bluetoothPrint';
import {
  forgetPrinter,
  loadPrinter,
  savePrinter,
  type SavedPrinter,
} from '../storage/printerStore';
import { haptics } from '../utils/haptics';

export type Link = 'idle' | 'connecting' | 'connected' | 'failed';

/**
 * The shop's printer and the connection to it. The remembered printer is
 * connected to as soon as a page opens, so Print starts the moment it is
 * tapped; a newly picked printer is remembered and connected to (and paired,
 * if Android asks) straight away, so the tailor sees at once that it works.
 */
export function usePrinter() {
  const [printer, setPrinter] = useState<SavedPrinter | null>(loadPrinter);
  const [link, setLink] = useState<Link>('idle');
  const [problem, setProblem] = useState<PrintProblem | null>(null);
  // Only the latest attempt may report: picking another printer while the
  // last one is still connecting makes the old answer stale.
  const attempt = useRef(0);

  const connect = useCallback(
    async (target: SavedPrinter, quiet = false): Promise<void> => {
      const mine = ++attempt.current;
      setLink('connecting');
      setProblem(null);
      try {
        await connectPrinter(target.address);
        if (mine !== attempt.current) return;
        setLink('connected');
        if (!quiet) haptics.success();
      } catch (error) {
        if (mine !== attempt.current) return;
        setLink('failed');
        // Opening a page with the printer switched off is normal: the row
        // says "not connected" and Print tries again; only a choice the
        // tailor just made gets the full explanation.
        if (!quiet) {
          haptics.error();
          setProblem(toPrinterError(error).problem);
        }
      }
    },
    []
  );

  useEffect(() => {
    const saved = loadPrinter();
    if (saved) void connect(saved, true);
  }, [connect]);

  const choose = useCallback(
    (device: BluetoothDevice): void => {
      const chosen = { name: device.name, address: device.address };
      savePrinter(chosen);
      setPrinter(chosen);
      void connect(chosen);
    },
    [connect]
  );

  const forget = useCallback((): void => {
    attempt.current++;
    forgetPrinter();
    setPrinter(null);
    setLink('idle');
    setProblem(null);
  }, []);

  return {
    printer,
    /** The printer's name as the tailor knows it. */
    printerName: printer?.name || printer?.address || '',
    link,
    setLink,
    problem,
    setProblem,
    connect,
    choose,
    forget,
  };
}
