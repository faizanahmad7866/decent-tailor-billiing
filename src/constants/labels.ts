// The words a bill is made of, written in English and Hindi on one line, so a
// tailor who reads either understands at a glance. One place for them: the
// New Bill summary and the saved bill's page show the same figures, and must
// call them the same things. "Making" is सिलाई — the stitching charge.

export const LABEL = {
  // Headings
  customer: 'Customer · ग्राहक',
  cloth: 'Cloth · कपड़ा',
  stitching: 'Stitching · सिलाई',
  discountAndPayment: 'Discount & payment · छूट और भुगतान',
  summary: 'Summary · सारांश',
  amount: 'Amount · रकम',
  payments: 'Payments · भुगतान',
  scanToPay: 'Scan to pay · स्कैन करके भुगतान',

  // Figures
  making: 'Making · सिलाई',
  price: 'Price · कीमत',
  discount: 'Discount · छूट',
  total: 'Total · कुल',
  paid: 'Paid · दिया',
  paidNow: 'Paid now · अभी दिया',
  alreadyPaid: 'Already paid · पहले दिया',
  balance: 'Balance · बाकी',
  balanceDue: 'Balance due · बाकी',
} as const;
