import { Linking, Share } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { pendingPaise, type Bill } from '../repositories/billRepo';
import type { Cloth } from '../repositories/clothRepo';
import type { ClothType } from '../repositories/clothTypeRepo';
import type { SavedPrinter } from '../storage/printerStore';
import { billTitle } from '../utils/customer';
import { formatDateTime } from '../utils/dates';
import { buildBillHtml } from './billHtml';
import { billMessageUrl, type MessageChannel } from './billMessage';
import { buildBillText } from './billText';
import { clothLabelJob } from './clothLabel';
import { sendToPrinter, type Pace, type PrintStage } from './bluetoothPrint';
import { printJob, qrBlock, textBlock } from './escpos';
import { getLogoDataUri, getPaymentBarcodeDataUri } from './logoAsset';
import { receiptJob, receiptParts } from './receiptText';
import { SHOP } from './shop';
import { billPaymentQr } from './upiQr';

// How fast a job goes out: well under what a printer's Bluetooth link
// passes on, and each line given the time a slow 58 mm head (300 dot rows a
// second, 37 mm/s) takes to print it before the next.
const PACE: Pace = { bytesPerSecond: 8000, rowsPerSecond: 300 };

/** Prints the bill's till receipt on the shop's Bluetooth printer. */
export function printReceipt(
  bill: Bill,
  printer: SavedPrinter,
  onStage?: (stage: PrintStage) => void
): Promise<void> {
  return sendToPrinter(
    printer.address,
    receiptJob(receiptParts(bill)),
    PACE,
    onStage
  );
}

/** Prints the QR label for a cloth, or one type of it, on the Bluetooth printer. */
export function printClothLabel(
  cloth: Cloth,
  type: ClothType | null,
  printer: SavedPrinter,
  onStage?: (stage: PrintStage) => void
): Promise<void> {
  return sendToPrinter(
    printer.address,
    clothLabelJob(cloth, type),
    PACE,
    onStage
  );
}

/**
 * A short page that proves the printer is set up: text in its own font and
 * a QR code, the two things a bill is made of.
 */
export function printTestPage(
  printer: SavedPrinter,
  onStage?: (stage: PrintStage) => void
): Promise<void> {
  const page = printJob(
    textBlock([
      { text: SHOP.name, bold: true, big: true },
      { text: 'Printer test', bold: true },
      { text: printer.name || printer.address },
      { text: formatDateTime(new Date().toISOString()) },
      { text: '' },
    ]),
    qrBlock('DT Billing printer test'),
    textBlock([
      { text: 'Text and QR printed?' },
      { text: 'Then bills will print too.', bold: true },
    ])
  );
  return sendToPrinter(printer.address, page, PACE, onStage);
}

/**
 * The code a bill carries for the customer to pay with: the shop's UPI with
 * the balance filled in, so they scan and enter only their PIN. If that code
 * can't be built the bank's own QR goes in instead — the customer then types
 * the amount — rather than the bill going out with no way to pay. Nothing
 * once the bill is settled.
 */
async function paymentQr(bill: Bill): Promise<string | null> {
  const due = pendingPaise(bill);
  if (due <= 0) return null;
  try {
    return billPaymentQr(due, bill.id);
  } catch {
    return getPaymentBarcodeDataUri().catch(() => null);
  }
}

async function billHtml(bill: Bill): Promise<string> {
  // The logo and the QR are extras: a bill that can't read one still goes
  // out, because a bill that never reaches the customer is no bill.
  const [logo, qr] = await Promise.all([
    getLogoDataUri().catch(() => null),
    paymentQr(bill),
  ]);
  return buildBillHtml(bill, logo, qr);
}

/**
 * Makes the full-page bill a PDF and opens the share sheet (WhatsApp and so
 * on) — the bill to read on a phone, where a till roll would be too narrow.
 */
export async function shareBill(bill: Bill): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html: await billHtml(bill) });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: billTitle(bill),
  });
}

/**
 * Opens WhatsApp or the SMS app on a chat with the number on the bill, the
 * bill already written in it. Throws if the bill has no number, or nothing
 * on the phone can open the link.
 */
export async function sendBillMessage(
  bill: Bill,
  channel: MessageChannel
): Promise<void> {
  const url = billMessageUrl(bill, channel);
  if (!url) throw new Error('The bill has no mobile number');
  await Linking.openURL(url);
}

/**
 * Opens the share sheet with the bill written out as a message: for a bill
 * with no number on it, where the tailor chooses who to send it to.
 */
export async function shareBillText(bill: Bill): Promise<void> {
  await Share.share(
    { message: buildBillText(bill) },
    { dialogTitle: billTitle(bill) }
  );
}
