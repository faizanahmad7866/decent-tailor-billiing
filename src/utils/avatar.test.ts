import { initialOf } from './avatar';

describe('initialOf', () => {
  it('is the first letter, upper-case', () => {
    expect(initialOf('  imran shaikh')).toBe('I');
  });

  it('is "?" for a blank name', () => {
    expect(initialOf('   ')).toBe('?');
  });
});
