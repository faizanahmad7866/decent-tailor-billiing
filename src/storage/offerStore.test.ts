import { parseOffers } from './offerStore';

jest.mock('expo-file-system', () => ({ File: class {}, Paths: {} }));

const saved = {
  id: 1,
  occasion: 'Eid offer',
  title: '10% off',
  note: 'On all suits',
  icon: 'gift',
  endsAt: '2026-11-05T00:00:00.000Z',
  on: false,
};

describe('parseOffers', () => {
  it('reads back what was saved', () => {
    expect(parseOffers(JSON.stringify([saved]))).toEqual([saved]);
  });

  it('fills in what is missing, and an icon it does not know', () => {
    const [offer] = parseOffers(
      JSON.stringify([
        { id: 2, title: 'Sale', endsAt: saved.endsAt, icon: 'rocket' },
      ])
    );
    expect(offer).toMatchObject({
      occasion: '',
      note: '',
      icon: 'sparkles',
      on: true,
    });
  });

  it('drops anything that is not an offer', () => {
    expect(parseOffers('null')).toEqual([]);
    expect(
      parseOffers(
        JSON.stringify([{ id: 3 }, { id: 4, title: 'x', endsAt: 'soon' }, null])
      )
    ).toEqual([]);
  });
});
