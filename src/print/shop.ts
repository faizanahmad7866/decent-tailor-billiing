/**
 * The shop as it appears on a printed bill. Kept word for word with the main
 * Decent Tailor app's letterhead (src/print/businessIdentity.ts there), so a
 * customer holding bills from both sees one shop.
 */
export const SHOP = {
  name: 'DECENT TAILOR',
  tagline: 'The Genius of Pattern',
  address: 'Near Tawakkal Kirana, Lalkhadi Road, Amravati',
  contacts: [
    { label: 'Shoeb', phone: '9665667219' },
    { label: 'Juned', phone: '9665718519' },
  ],
} as const;
