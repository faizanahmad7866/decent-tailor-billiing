// The schema, as the steps that build it. Each step runs once per phone, in
// order, and SQLite's user_version records how many have run. A step is never
// edited once it has shipped — a schema change is a new step at the end, so
// every phone, however old its copy, arrives at the same tables.
//
// NEVER INSERT A STEP IN THE MIDDLE, OR REORDER THEM. A phone remembers only
// how many steps it has run, so a step slipped in before the last one makes a
// phone that already ran the old step N run the new one in its place — and
// the app then fails to start ("table already exists"). Add at the bottom.
// migrations.test.ts pins the order and fails if it changes.
export const MIGRATIONS: readonly string[] = [
  `CREATE TABLE cloths (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL COLLATE NOCASE UNIQUE,
     price_per_meter_paise INTEGER NOT NULL CHECK (price_per_meter_paise >= 0),
     image_name TEXT,
     created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
     updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
   );`,

  // A bill keeps its own copy of every name and rate it was made with, and
  // its totals as they were worked out then. Editing or deleting a cloth
  // later never changes a bill already handed to a customer.
  `CREATE TABLE bills (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     customer_name TEXT NOT NULL,
     customer_mobile TEXT,
     cloth_paise INTEGER NOT NULL,
     making_paise INTEGER NOT NULL,
     discount_paise INTEGER NOT NULL DEFAULT 0,
     total_paise INTEGER NOT NULL CHECK (total_paise >= 0),
     created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
   );
   CREATE TABLE bill_cloths (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
     cloth_name TEXT NOT NULL,
     price_per_meter_paise INTEGER NOT NULL,
     length_cm INTEGER NOT NULL CHECK (length_cm > 0),
     amount_paise INTEGER NOT NULL
   );
   CREATE TABLE bill_garments (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
     name TEXT NOT NULL,
     quantity INTEGER NOT NULL CHECK (quantity > 0),
     making_paise INTEGER NOT NULL CHECK (making_paise >= 0),
     amount_paise INTEGER NOT NULL
   );
   CREATE TABLE payments (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
     amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
     created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
   );
   CREATE INDEX idx_bill_cloths_bill ON bill_cloths(bill_id);
   CREATE INDEX idx_bill_garments_bill ON bill_garments(bill_id);
   CREATE INDEX idx_payments_bill ON payments(bill_id);`,

  // A cloth on a bill can carry its sub-type ("Royal Blue Linen") and an
  // extra charge per meter for this bill alone. price_per_meter_paise stays
  // the rate actually charged — catalog price plus the extra. cloth_id links
  // back to the catalog so past sub-types can be suggested again; it is left
  // unenforced, since deleting a cloth must never touch a bill.
  `ALTER TABLE bill_cloths ADD COLUMN cloth_id INTEGER;
   ALTER TABLE bill_cloths ADD COLUMN variant TEXT;
   ALTER TABLE bill_cloths ADD COLUMN extra_per_meter_paise INTEGER NOT NULL DEFAULT 0;
   CREATE INDEX idx_bill_cloths_cloth ON bill_cloths(cloth_id);`,

  // Rate Master: the shop's usual making charge for each garment, filled in
  // for the tailor when the garment is added to a bill. The garments and
  // starting rates are the main Decent Tailor app's own, so both apps open
  // with the same list.
  `CREATE TABLE garment_rates (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL COLLATE NOCASE UNIQUE,
     making_paise INTEGER NOT NULL CHECK (making_paise >= 0),
     sort_order INTEGER NOT NULL
   );
   INSERT INTO garment_rates (name, making_paise, sort_order) VALUES
     ('Shirt', 50000, 1),
     ('Pant', 40000, 2),
     ('Kurta', 50000, 3),
     ('Pajama', 40000, 4),
     ('Kurta Pajama', 80000, 5),
     ('Pathani', 80000, 6),
     ('Salwar', 30000, 7),
     ('Coat', 120000, 8),
     ('Sadri', 60000, 9),
     ('V-Jacket', 90000, 10),
     ('Jodhpuri', 150000, 11),
     ('Long Jacket', 100000, 12),
     ('Indo Western', 130000, 13);`,

  // A cloth's name in Hindi, kept beside the English one. Null on every cloth
  // made before this: those are shown with the Hindi worked out from the name
  // until they are saved again. A bill keeps its own copy, as it does of
  // everything else about the cloth.
  `ALTER TABLE cloths ADD COLUMN name_hi TEXT;
   ALTER TABLE bill_cloths ADD COLUMN cloth_name_hi TEXT;`,

  // The pattern catalogue — the shop's own designs (a Jodhpuri, a coat) shown
  // to customers like a menu: categories, and in each the items with a name,
  // a price, a few photos and one video. Only file names are kept here; the
  // photos and the video live in the app's own folder. Nothing on a bill
  // points at these, so deleting an item never touches a bill.
  `CREATE TABLE pattern_categories (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL COLLATE NOCASE UNIQUE,
     created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
   );
   CREATE TABLE pattern_items (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     category_id INTEGER NOT NULL REFERENCES pattern_categories(id),
     name TEXT NOT NULL,
     price_paise INTEGER NOT NULL CHECK (price_paise >= 0),
     video_name TEXT,
     created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
     updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
   );
   CREATE TABLE pattern_item_images (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     item_id INTEGER NOT NULL REFERENCES pattern_items(id),
     image_name TEXT NOT NULL,
     position INTEGER NOT NULL
   );
   CREATE INDEX idx_pattern_items_category ON pattern_items(category_id);
   CREATE INDEX idx_pattern_item_images_item ON pattern_item_images(item_id, position);`,

  // The catalogue opens ready: a category for every garment in the Rate Master
  // (a Shirt, a Pant, a Jodhpuri, a Coat…), in the Rate Master's own order.
  // Made once; after that categories are the tailor's — added, renamed or
  // deleted freely, and a deleted one does not come back. A phone whose tailor
  // had already made a category of the same name (a "Jodhpuri") keeps theirs:
  // OR IGNORE, because the names are unique and a plain INSERT would stop the
  // app from starting.
  `INSERT OR IGNORE INTO pattern_categories (name)
     SELECT name FROM garment_rates ORDER BY sort_order;`,

  // What a design is made of: the cloths it needs and how many meters of each,
  // and the stitching charge. Its price is worked out from these — each
  // cloth's rate times its meters, plus the stitching — so it follows the
  // catalog's rates. A line keeps the cloth's name and rate as they were when
  // it was added, for when the cloth is later deleted from the catalog;
  // cloth_id is left unenforced, since deleting a cloth must never touch a
  // design. A design made before this has no lines: it keeps the price it was
  // given (pattern_items.price_paise).
  `ALTER TABLE pattern_items ADD COLUMN stitching_paise INTEGER NOT NULL DEFAULT 0;
   CREATE TABLE pattern_item_cloths (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     item_id INTEGER NOT NULL REFERENCES pattern_items(id),
     cloth_id INTEGER,
     cloth_name TEXT NOT NULL,
     price_per_meter_paise INTEGER NOT NULL,
     length_cm INTEGER NOT NULL CHECK (length_cm > 0),
     position INTEGER NOT NULL
   );
   CREATE INDEX idx_pattern_item_cloths_item ON pattern_item_cloths(item_id, position);`,

  // A design's cloth line carries what a bill's does: the cloth's type (a note
  // for the customer — "Royal blue") and an extra per meter on top of the
  // catalog rate. price_per_meter_paise stays the catalog rate the line was
  // added at; the rate charged is that plus the extra.
  `ALTER TABLE pattern_item_cloths ADD COLUMN variant TEXT;
   ALTER TABLE pattern_item_cloths ADD COLUMN extra_per_meter_paise INTEGER NOT NULL DEFAULT 0;`,

  // An optional note on a cloth and on a design ("Dry clean only"), with its
  // Hindi: written from the English as it is typed, and kept as saved so a
  // Hindi the tailor corrected by hand stays.
  `ALTER TABLE cloths ADD COLUMN note TEXT;
   ALTER TABLE cloths ADD COLUMN note_hi TEXT;
   ALTER TABLE pattern_items ADD COLUMN note TEXT;
   ALTER TABLE pattern_items ADD COLUMN note_hi TEXT;`,

  // The types a cloth comes in, each with its own rate and optional photo. A
  // bill line still keeps its type as words and its rate as a number, written
  // when it was made, so deleting a type never touches a bill.
  `CREATE TABLE cloth_types (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     cloth_id INTEGER NOT NULL REFERENCES cloths(id) ON DELETE CASCADE,
     name TEXT NOT NULL COLLATE NOCASE,
     price_per_meter_paise INTEGER NOT NULL CHECK (price_per_meter_paise >= 0),
     image_name TEXT,
     UNIQUE (cloth_id, name)
   );
   CREATE INDEX idx_cloth_types_cloth ON cloth_types(cloth_id);`,

  // The tailor's own DT number on a bill, without the "DT": optional, and as
  // written. Not unique: it is a reference for people, not a key.
  `ALTER TABLE bills ADD COLUMN dt_number TEXT;`,
];
