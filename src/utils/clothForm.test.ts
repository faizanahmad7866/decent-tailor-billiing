import { normalizeClothName, validateClothForm } from './clothForm';

describe('normalizeClothName', () => {
  it('trims and collapses inner spaces', () => {
    expect(normalizeClothName('  Cotton   Blue ')).toBe('Cotton Blue');
  });
});

describe('validateClothForm', () => {
  it('returns the cleaned name and the price in paise', () => {
    expect(validateClothForm(' Linen  White ', '450.50')).toEqual({
      ok: true,
      name: 'Linen White',
      pricePerMeterPaise: 45050,
    });
  });

  it('asks for both fields when the form is empty', () => {
    expect(validateClothForm('  ', '')).toEqual({
      ok: false,
      errors: {
        name: 'Enter the cloth name',
        price: 'Enter the price per meter',
      },
    });
  });

  it('rejects a price that is not a number', () => {
    expect(validateClothForm('Silk', '4,50')).toEqual({
      ok: false,
      errors: { price: 'Enter a price like 450 or 450.50' },
    });
  });

  it('rejects a zero price', () => {
    expect(validateClothForm('Silk', '0')).toEqual({
      ok: false,
      errors: { price: 'Price must be more than ₹0' },
    });
  });
});
