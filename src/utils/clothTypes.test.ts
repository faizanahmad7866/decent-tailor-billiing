import {
  matchType,
  rateAfterTypeChange,
  validateClothType,
} from './clothTypes';

const types = [
  { name: 'Royal', pricePerMeterPaise: 100000 },
  { name: 'Classic', pricePerMeterPaise: 150000 },
];
const CLOTH = 120000;

describe('matchType', () => {
  it('finds a defined type whatever the capitals and spaces', () => {
    expect(matchType(types, ' royal ')?.pricePerMeterPaise).toBe(100000);
  });

  it('finds nothing for a blank or a name not defined', () => {
    expect(matchType(types, '  ')).toBeUndefined();
    expect(matchType(types, 'Roy')).toBeUndefined();
  });
});

describe('rateAfterTypeChange', () => {
  it('takes the rate of a defined type when it is chosen', () => {
    expect(rateAfterTypeChange(types, CLOTH, '', 'Royal')).toBe(100000);
    expect(rateAfterTypeChange(types, CLOTH, 'Royal', 'Classic')).toBe(150000);
  });

  it('goes back to the cloth rate when a defined type is left', () => {
    expect(rateAfterTypeChange(types, CLOTH, 'Royal', 'Roya')).toBe(CLOTH);
    expect(rateAfterTypeChange(types, CLOTH, 'Royal', '')).toBe(CLOTH);
  });

  it('leaves the rate alone for a name typed by hand', () => {
    expect(rateAfterTypeChange(types, CLOTH, '', 'Blue')).toBeUndefined();
    expect(
      rateAfterTypeChange(types, CLOTH, 'Blue', 'Blue dark')
    ).toBeUndefined();
  });

  it('never reprices a line on a cloth with no types', () => {
    expect(rateAfterTypeChange([], CLOTH, 'Old', 'New')).toBeUndefined();
  });
});

describe('validateClothType', () => {
  it('tidies the name and reads the price', () => {
    expect(validateClothType('  Royal   Blue ', '1000', [])).toEqual({
      ok: true,
      name: 'Royal Blue',
      pricePerMeterPaise: 100000,
    });
  });

  it('asks for what is missing', () => {
    expect(validateClothType(' ', '', [])).toEqual({
      ok: false,
      errors: {
        name: 'Enter the type name',
        price: 'Enter the price per meter',
      },
    });
  });

  it('refuses a name the cloth already has, ignoring capitals', () => {
    expect(validateClothType('royal', '1000', ['Royal'])).toEqual({
      ok: false,
      errors: { name: '“royal” is already on this cloth' },
    });
  });

  it('refuses a price that is nothing or not a price', () => {
    expect(validateClothType('A', '0', [])).toMatchObject({
      errors: { price: 'Price must be more than ₹0' },
    });
    expect(validateClothType('A', 'abc', [])).toMatchObject({
      errors: { price: 'Enter a price like 450 or 450.50' },
    });
  });
});
