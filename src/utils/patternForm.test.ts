import {
  normalizePatternName,
  validateCategoryName,
  validatePatternItem,
} from './patternForm';

describe('normalizePatternName', () => {
  it('trims and squeezes the spaces', () => {
    expect(normalizePatternName('  Royal   Jodhpuri ')).toBe('Royal Jodhpuri');
  });
});

// A cloth at ₹1,200 a meter, unless a test says otherwise.
const line = (meters: string, extra = '', pricePerMeterPaise = 120000) => ({
  meters,
  extra,
  pricePerMeterPaise,
});

describe('validatePatternItem', () => {
  it('returns the name, the lengths in cm, the extras and the stitching in paise', () => {
    expect(
      validatePatternItem(
        ' Royal  Jodhpuri ',
        [line('3', '100'), line('1.5')],
        '1500'
      )
    ).toEqual({
      ok: true,
      name: 'Royal Jodhpuri',
      lengthsCm: [300, 150],
      extrasPaise: [10000, 0],
      stitchingPaise: 150000,
    });
  });

  it('takes a blank stitching charge and a blank extra as none', () => {
    expect(validatePatternItem('Coat', [line('2', '  ')], '  ')).toMatchObject({
      ok: true,
      extrasPaise: [0],
      stitchingPaise: 0,
    });
  });

  it('asks for a name, and does not ask for a cloth', () => {
    expect(validatePatternItem('  ', [], '')).toEqual({
      ok: false,
      errors: {
        name: 'Enter the design name',
        extras: [],
        meters: [],
      },
    });
  });

  it('says which cloth has no meters, and refuses zero', () => {
    const result = validatePatternItem(
      'Coat',
      [line('2'), line(''), line('0')],
      ''
    );
    expect(result).toMatchObject({ ok: false });
    if (result.ok) return;
    expect(result.errors.meters[0]).toBeUndefined();
    expect(result.errors.meters[1]).toBe('Enter the meters, like 2.5');
    expect(result.errors.meters[2]).toBe('Enter the meters, like 2.5');
  });

  it('says which cloth has an extra that is not an amount', () => {
    const result = validatePatternItem(
      'Coat',
      [line('2', '100'), line('2', 'abc')],
      ''
    );
    expect(result).toMatchObject({ ok: false });
    if (result.ok) return;
    expect(result.errors.extras[0]).toBeUndefined();
    expect(result.errors.extras[1]).toBe('Enter an amount like 100');
  });

  it('takes a minus extra off the cloth, for one that sells for less than the catalog', () => {
    expect(
      validatePatternItem('Royal Armani', [line('3', '-200')], '')
    ).toMatchObject({ ok: true, extrasPaise: [-20000] });
  });

  it('refuses a reduction that would make the cloth free', () => {
    const result = validatePatternItem('Coat', [line('2', '-1200')], '');
    expect(result).toMatchObject({ ok: false });
    if (result.ok) return;
    expect(result.errors.extras[0]).toBe(
      "Take off less than ₹1,200, the cloth's price"
    );
  });

  it('refuses a stitching charge that is not an amount', () => {
    expect(validatePatternItem('Coat', [line('2')], 'abc')).toMatchObject({
      ok: false,
      errors: { stitching: 'Enter an amount like 1500' },
    });
  });
});

describe('validatePatternItem without a cloth', () => {
  it('saves a design with only a name', () => {
    expect(validatePatternItem('Royal Coat', [], '')).toEqual({
      ok: true,
      name: 'Royal Coat',
      lengthsCm: [],
      extrasPaise: [],
      stitchingPaise: 0,
    });
  });
});

describe('validateCategoryName', () => {
  it('tidies a name', () => {
    expect(validateCategoryName('  Jodhpuri ')).toEqual({
      ok: true,
      name: 'Jodhpuri',
    });
  });

  it('refuses an empty name', () => {
    expect(validateCategoryName('   ')).toEqual({
      ok: false,
      error: 'Enter a category name',
    });
  });
});
