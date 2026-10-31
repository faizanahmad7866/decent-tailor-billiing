import {
  clothLineAmount,
  computeBillTotals,
  discountAmount,
  formatMeters,
  metersToInput,
  parseMeters,
  stepMeters,
  totalLengthCm,
} from './billMath';

describe('parseMeters', () => {
  it.each([
    ['2', 200],
    ['2.5', 250],
    ['2.25', 225],
    ['.75', 75],
    // 1.15 * 100 is 114.99999… in floating point; rounding keeps it exact.
    ['1.15', 115],
  ])('reads "%s" as %i cm', (text, cm) => {
    expect(parseMeters(text)).toBe(cm);
  });

  it.each(['', 'abc', '-1', '2.255', '1000', '2,5'])('rejects "%s"', (text) => {
    expect(parseMeters(text)).toBeNull();
  });
});

describe('totalLengthCm', () => {
  it('adds the lengths of every cloth on a bill', () => {
    expect(totalLengthCm([{ lengthCm: 250 }, { lengthCm: 300 }])).toBe(550);
  });

  it('is zero for a bill with no cloth', () => {
    expect(totalLengthCm([])).toBe(0);
  });
});

describe('formatMeters', () => {
  it.each([
    [300, '3 m'],
    [250, '2.5 m'],
    [225, '2.25 m'],
  ])('formats %i cm as %s', (cm, text) => {
    expect(formatMeters(cm)).toBe(text);
  });
});

describe('clothLineAmount', () => {
  it('charges the price per meter for the length taken', () => {
    // 2.25 m at ₹450 = ₹1,012.50
    expect(clothLineAmount({ pricePerMeterPaise: 45000, lengthCm: 225 })).toBe(
      101250
    );
  });

  it('rounds to the nearest paisa', () => {
    // 1.33 m at ₹333.33 = ₹443.3289
    expect(clothLineAmount({ pricePerMeterPaise: 33333, lengthCm: 133 })).toBe(
      44333
    );
  });
});

describe('discountAmount', () => {
  it('takes a percentage of the subtotal', () => {
    expect(discountAmount({ kind: 'percent', percent: 10 }, 125000)).toBe(
      12500
    );
  });

  it('never discounts more than the subtotal', () => {
    expect(discountAmount({ kind: 'amount', paise: 90000 }, 50000)).toBe(50000);
    expect(discountAmount({ kind: 'percent', percent: 150 }, 50000)).toBe(
      50000
    );
  });
});

describe('computeBillTotals', () => {
  it('adds cloth and making, then takes off the discount', () => {
    const totals = computeBillTotals(
      [
        { pricePerMeterPaise: 45000, lengthCm: 250 }, // ₹1,125
        { pricePerMeterPaise: 30000, lengthCm: 120 }, // ₹360
      ],
      [
        { quantity: 2, makingPaise: 40000 }, // ₹800
        { quantity: 1, makingPaise: 50000 }, // ₹500
      ],
      { kind: 'amount', paise: 18500 }
    );

    expect(totals).toEqual({
      clothPaise: 148500,
      makingPaise: 130000,
      subtotalPaise: 278500,
      discountPaise: 18500,
      totalPaise: 260000,
    });
  });

  it('is zero for an empty bill', () => {
    expect(
      computeBillTotals([], [], { kind: 'percent', percent: 10 }).totalPaise
    ).toBe(0);
  });
});

describe('metersToInput', () => {
  it.each([
    [300, '3'],
    [250, '2.5'],
    [225, '2.25'],
    [5, '0.05'],
  ])('writes %i cm as "%s"', (cm, text) => {
    expect(metersToInput(cm)).toBe(text);
  });

  it('round-trips through parseMeters', () => {
    for (const cm of [5, 100, 115, 250, 99900]) {
      expect(parseMeters(metersToInput(cm))).toBe(cm);
    }
  });
});

describe('stepMeters', () => {
  it('moves a length up or down by the step', () => {
    expect(stepMeters('2', 50)).toBe('2.5');
    expect(stepMeters('2.5', -50)).toBe('2');
    expect(stepMeters('2.25', 50)).toBe('2.75');
  });

  it('starts from nothing when the field is blank or not a length', () => {
    expect(stepMeters('', 50)).toBe('0.5');
    expect(stepMeters('abc', 50)).toBe('0.5');
  });

  it('goes back to blank, never to zero or below', () => {
    expect(stepMeters('0.5', -50)).toBe('');
    expect(stepMeters('', -50)).toBe('');
  });

  it('stops at the most the field takes', () => {
    expect(stepMeters('999.75', 50)).toBe('999');
  });
});
