import type { BillSummary } from '../repositories/billRepo';
import { groupBillsByDay } from './billList';

const bill = (id: number, at: Date): BillSummary => ({
  id,
  customerName: `Customer ${id}`,
  customerMobile: null,
  dtNumber: null,
  clothText: null,
  totalLengthCm: 0,
  totalPaise: 1000,
  paidPaise: 0,
  createdAt: at.toISOString(),
});

describe('groupBillsByDay', () => {
  const now = new Date(2026, 9, 28, 15, 0);

  it('groups bills of the same day under one heading, newest first', () => {
    const sections = groupBillsByDay(
      [
        bill(5, new Date(2026, 9, 28, 14, 0)),
        bill(4, new Date(2026, 9, 28, 9, 0)),
        bill(3, new Date(2026, 9, 27, 18, 0)),
        bill(2, new Date(2026, 9, 20, 11, 0)),
        bill(1, new Date(2026, 9, 20, 10, 0)),
      ],
      now
    );

    expect(sections.map((s) => s.title)).toEqual([
      'Today',
      'Yesterday',
      '20 Oct 2026',
    ]);
    expect(sections.map((s) => s.data.map((b) => b.id))).toEqual([
      [5, 4],
      [3],
      [2, 1],
    ]);
  });

  it('gives no sections for no bills', () => {
    expect(groupBillsByDay([], now)).toEqual([]);
  });
});
