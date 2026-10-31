# DT Billing

Cloth billing for Decent Tailor. The tailor keeps a catalog of the cloths they
sell — photo, name and price per meter — and bills customers from it.

A companion to the main Decent Tailor app (orders and measurements). It shares
that app's stack and brand, and runs fully offline: all data stays in SQLite
on the phone.

## Run it

```sh
npm install
npm run android      # builds the dev client and installs it on a device/emulator
npm start            # Metro, once the dev client is installed
```

Checks — run all three before every change is called done:

```sh
npm run typecheck
npm run lint
npm test
```

## Layout

```
App.tsx                  startup: database, splash, navigation
src/
  constants/theme.ts     colors, type scale, radii — the only place they live
  components/            shared building blocks (Tap, Button, TextField, …)
  screens/               one file per page
  navigation/            the stack and its typed params
  repositories/          all SQL; screens never touch the database directly
  db/database.ts         connection and schema migrations
  storage/               photo files and the chosen printer, on disk
  print/                 the receipt for the printer, the shared PDF bill
  utils/                 pure logic, each with its own *.test.ts
modules/bluetooth-printer/  native Bluetooth (SPP) printer module, Android
```

## How a bill works

1. **Bills** tab → **New bill**: customer, cloths (picked from the catalog,
   meters typed), garments with a making charge each, discount (₹ or %), and
   anything paid now.
2. **Create bill** saves it in one transaction and opens it.
3. On the bill: **Print**, **Share PDF**, and **Collect** the balance later.

Garments and their usual making charges live in **Settings → Rate Master**
(same list and starting rates as the main app). Adding a garment to a bill
fills its charge in from there; the tailor can still change it per bill.

**Settings → Backup & Restore** writes one `.db` file — the database plus
every cloth photo — and restores from it after checking it is a DT Billing
backup.

**Cloth first.** The bill is about cloth, so the cloth leads everywhere it
shows: on a saved bill each cloth is a card (photo, big English + Hindi name,
then Meters in the accent colour, Rate / meter and Amount side by side, with the
bill's total meters in the section header); on the Bills list each bill shows
its cloth names and total meters under the customer; on the printed receipt
cloth names are bold. The catalog and the cloth picker name and price a cloth
the same way (`ClothNames`, `ClothPrice`): a big heavy name with its Hindi
under it, and the rate per meter large in the accent colour.

**Cloth types** (optional; `repositories/clothTypeRepo.ts`, migration 11). A cloth can
come in types, each with its own name, **its own price per meter** and, if wanted, its
own photo: added when the cloth is added or edited, or from its page. Its **Hindi is
written automatically** as the name is typed, shown in its own box on the type's sheet
and beside its name wherever it appears; it is worked out from the name, not saved,
so renaming a type renames its Hindi too. On a bill or a
design's cloth, the types drop down under the Cloth type box (`ClothTypeInput`) with
their photo and rate; choosing one takes its rate. Anything else can still be typed by
hand, as a note, at the cloth's own rate, and a name typed by hand never changes the
rate on an old bill (`utils/clothTypes.ts`). A bill keeps its type as words and its
rate as a number, so changing or deleting a type never touches a bill; a design's cloth
follows its type's rate today, and the cloth's if the type is deleted.

**The cloth's page** (`ClothDetailScreen`; saving a new cloth opens it, as does tapping
one in the catalog or scanning its label) is the record of the cloth: photo, name,
price per meter, note, its types with their rates and photos to add to and edit, and
its QR. Bills are made on New Bill, not from here.

**Cloth QR.** A QR carries only numbers (`DTB-CLOTH:12`, or `DTB-CLOTH:12:T3` for one
type, `utils/clothQr.ts`); the name and price are read from the catalog when it is
scanned, so a changed price is never stale on an old label, and labels printed before
types came along still work. A cloth with no types shows its one QR on its page. A
cloth with types has several, so **Create QR** asks first: the whole cloth, or which
type (each type's row also opens its own). The label is printed in the printer's own
font with its own QR command, and carries no rate (`print/clothLabel.ts`). Scanning
(`components/ClothScanner.tsx`, expo-camera; the phone gives one firm vibration when a
code is read, two short ones when it is refused) works from the camera button in the home
header, which opens the cloth's page, and from **Scan QR** on New Bill, which adds the
line — with its type and rate, for a type's label. expo-camera is a native module, so
adding it needed a new build of the app.

**Pattern catalogue** (the Patterns tab) is the shop's own designs, shown to
customers like a menu. It opens ready: a category for every garment in the Rate Master (migration 7,
made once, in the Rate Master's order), each showing its garment's picture
until a design with a photo is added; after that categories are the tailor's
to add, rename or delete. Categories open as photo covers;
a category is a lookbook of tall photo cards with the name and the price; a
design opens full — photos to swipe, the name, the price, a video to play.
Each design has a name, optionally the **cloths it needs — each with its Cloth type, Extra per meter and Meters, the same three boxes as a bill (migration 9)**, a
stitching charge, up to three photos (the first is the cover) and one video
(from the gallery, under 40 MB). Its **price is not typed**: it is each cloth's
rate times its meters, plus the stitching (`utils/patternPricing.ts`) — worked
out live from the catalog's rates, so it moves when a cloth's price does, and
a cloth later deleted keeps the rate it was added with. The stitching charge
starts at the Rate Master's for the garment the category is named for. A design
made before this, with no cloths, keeps the price it was given, even when it is
edited. The cloth is optional: a design with no cloth is priced by its stitching
alone, and one with neither shows **Ask for price**, never ₹0, in the app and in
the PDF (`utils/patternPricing.ts`). The design page
shows each cloth with its meters, rate and amount, then Cloth + Stitching =
Price; the form shows the same as it is filled in.

**DT number.** New Bill has an optional **DT number** box with "DT" already in it; the
tailor writes what follows, letters and numbers as they like: `1` prints as `DT 1`, `-1`
as `DT-1` (as the main app writes them), `A-1` as `DT A-1` (`utils/dtNumber.ts`,
migration 12). A "DT" typed into the box is not doubled. It is the tailor's own reference,
so it is not checked against other bills. It appears on the receipt, the PDF, the message,
the reminder, the bill's page and the Bills list, and the list's search finds it.

**Analytics** (Settings → Business; `AnalyticsScreen`, `utils/clothSales.ts`) shows what
the cloth business did: the total sold, the meters and the bills, then each cloth, most
sold first, with its meters, amount, share of the total and, if it was sold by type, each
type's. It opens on the last month, and offers 2 months, 6 months or any days from a
calendar. It is added up from the bills' own lines, so it is what was charged; a discount
is on the whole bill rather than a cloth, so the figures are before discount.

**Reaching a customer.** A bill with money due shows **Collect, Call and Remind** on
its row in the Bills list, and **Call** and **Remind** under the figures
on its page (`components/bill/CustomerActions.tsx`). Call dials the number on the
bill. Remind opens WhatsApp on the customer's chat with a payment reminder written
in — what is due on which bill, in English and Hindi, the shop's UPI ID, and “if you
have already paid, please ignore this” (`print/paymentReminder.ts`, the same words
as the main app's) — for the tailor to press send. A bill with no number can't be
called or reminded, and its page says so.

**Phone and tablet.** All of the layout comes from `layout/useLayout.ts`: a device
whose shortest side is 600 dp or more is a tablet, whichever way it is held.

- **Phone:** the tabs in a bottom bar, its height set for the icon and label
  above the system's navigation bar; one column.
- **Tablet:** the tabs in a **rail down the right edge** (`navigation/NavRail.tsx`),
  which stands beside the whole stack in `AppFrame` and so stays on every page.
  Going to a tab from a page above returns through Home, so a form with unsaved
  changes still asks first. Lists and catalogues are grids; pages are centred.
- **Wide tablet (960 dp of content or more):** the bigger pages go to two columns
  with `PageColumns` (`layout/Page.tsx`) — New bill, a bill, a cloth, a design's
  form, Print, Settings — in the same order a phone reads them; Bills keeps its
  summary beside the list, and a design its photos beside its details.

Pages take their padding from `usePagePadding` and their foot from
`useBottomInset`, so nothing sits under the system's navigation bar, and the
side insets (a camera cutout, with the device on its side) are taken once, in
`AppFrame`.

**Extra can be a minus.** For a cloth that sells for less than the catalog says —
“Royal Armani” at ₹1,000 where Armani is ₹1,200 — pick **− Reduce** beside the
Extra box and type 200: the rate is catalog − 200 = ₹1,000 (shown in green, and
on the bill line as “Rate is ₹200 less per meter”). A phone's number keyboard
has no minus key, so the sign is a switch, not something typed; the value is
held as `-200` (`utils/money.ts` `parseSignedRupees`, `utils/extraAmount.ts`). A
reduction may not take the rate to ₹0 or below. It works the same in a bill,
the cloth page's calculator, and a design's cloths, and a design's cloth
carries it onto the bill made from it.

**Backup & delete** (Settings → Data). **Backup & Restore** makes one file with the
database and **every photo and video** (cloth photos, and the catalogue's photos
and videos), and the page counts what it will carry — “12 bills · 5 cloths · 3
designs · 18 photos · 2 videos” — from the files actually on the phone
(`storage/dataService.ts`). **Delete all data** removes every bill, cloth,
design, photo and video and restarts bill numbering at 1; it keeps the Rate
Master, the catalogue's categories and the printer, voice, language and dark mode
settings. It shows
the counts, offers **Create backup first**, and the red button only works once
**DELETE** is typed. The database part is one transaction, so a failure
changes nothing.

**Create bill from a design** (on its page): New Bill opens with the design's
cloths — each with its Cloth type, Extra and Meters, at the catalog's rate
today — and one stitching line named for the design, charged the design's
stitching (`utils/designBill.ts`), so the bill comes to the design's price.
Give it a customer and press **Create & print**: the bill is saved, opens, and
the Print page starts printing at once (`autoPrint`) — once the printer's
connection has settled, and Retry shows as for any print if it fails. Back from
the printer lands on the bill. The receipt reads CLOTH (name, type, meters × rate),
STITCHING (the design's name), then the totals.

**Notes**: a cloth and a design each take an optional **Note** (“Dry clean only”,
“Ready in 7 days”; migration 10), with its **Hindi written automatically** as
it is typed (`utils/noteHindi.ts`, `utils/noteForm.ts`) — in a box of its own
that can be corrected by hand, and then stays, as a cloth's Hindi name does.
The note shows on the cloth's page and the design's page, and in the PDF
catalogue, in English with the Hindi under it.

**Voice** (`voice/`, like the main app's): as the tailor adds **meters** — typing,
− and +, or a ready-made length — the app says them (“5 मीटर”, “2.5
मीटर”), and as they type a **discount** it says that (“10 परसेंट डिस्काउंट”,
“500 रुपये डिस्काउंट”), in Hindi (`hi-IN`), through the phone's own
text-to-speech (`expo-speech`, a native
module: a new build). It waits for the figure to settle for a moment, so typing
2.5 is not read as 2 and then 2.5, and it only speaks for what the tailor
changes — never for a bill that is just opened. **Settings → App → Voice**
switches it on or off (on to start), remembered in `voice.json`.

A design's photos are shown like a menu's: each **whole** (never cropped) on an
ivory mat inside a thin gold frame, one at a time to swipe, a count, and a small
picture of each below to jump to. The **cube button** (or a tap on the photo) opens them on the whole screen on a **3D stage**
(`components/pattern/PhotoStage.tsx`, `utils/photoStage.ts`): every photo the tailor
uploaded stands in a ring, the front one facing the customer and swaying gently, the
others turned in beside it. A finger turns the stage from one to the next and tips
the photo towards or away; a lone photo turns on the spot and comes back. It needs
nothing extra from the tailor, so every design has it, old ones too. The photos are
flat: this shows them in depth, it does not invent the side of a garment that was
never photographed. **Zoom in** or a double tap brings the front photo flat and large,
to drag around and look at the cloth and the work.

A design's **name is written in Hindi automatically**, as it is typed
(`utils/designHindi.ts`: a vocabulary of garment, occasion and style words, then
the cloth names' own rules, then letter by letter) — shown live under the name
box on the form, and under the English name on the design page, the category
grid, the PDF cover and the WhatsApp line. Nothing is saved: it is worked out
from the name each time.

**Share design** (on a design's page) sends the customer a **PDF catalogue**
(`print/designCatalogHtml.ts`, made with expo-print, A4) from the same family as the
shop's bill: a letterhead, the design's name and price, its first photo large on
white; then every other photo, the cloth as a table (swatch, meters, rate, amount),
cloth + stitching = total, any note, the shop's two numbers and address, and a QR
that opens a WhatsApp chat with the shop about that design. Dark neutral type and
hairlines, with the logo the only colour. Three ways to send it (`print/shareDesign.ts`):

- **WhatsApp**, in two steps, because a link can open a chat on a number but
  cannot carry a file: type the customer's number → **Send message** opens
  that chat with one line about the design → back in the app, **Send PDF**
  opens the share sheet; pick WhatsApp and that chat, now at the top.
- **Share PDF** to any app.
- **Download PDF**: saved to a folder the tailor picks (Downloads, say).

The PDF is made once per opening of the sheet, so it always carries today's
cloth rates. Data: `pattern_categories`,
`pattern_items`, `pattern_item_images` (migration 6), `pattern_item_cloths` (migration 8); files in the app's
`pattern-media` folder (`storage/patternMediaStore.ts`); the backup carries
them, videos included. The video plays with expo-video, a native module, so
this needed a new build of the app.

**Summary** (end of New Bill) is the whole bill from A to Z before it is made:
an invoice list — each cloth (English and Hindi name, "2.5 m × ₹1,300 / m",
amount), the total meters, each stitching line — then Cloth / Making /
Discount / Total / Paid now / Balance. The saved bill's page heads with the
customer, date and status, and Total · Paid · Balance due side by side. It follows what is typed (`draftLines` in
`utils/billForm.ts`).

**Send** (bill page): with a mobile number on the bill, "Send on WhatsApp" and
"Send as SMS" open a chat with _that number_ (`wa.me/91…`, `sms:+91…`) with
the bill already written in it — nothing to pick, the tailor presses send
(`print/billMessage.ts`). Without a number the share sheet asks who to send
it to. The PDF always goes through the share sheet: WhatsApp can't be handed
a file for a given number.

**Date filter** (calendar button beside the search on the Bills page): quick
options (today, this month, last month, last 30 / 60 days…) or days picked on
the calendar, one day or a first and last. It drives the list and the
All / Pending / Paid counts (`utils/dateRange.ts`).

**To collect period** (buttons on the dark panel at the top of Bills): 2, 4
or 6 months, or All. The To collect / Billed / Collected totals count only
the bills of that period, and the choice is remembered on the phone
(`storage/collectPeriodStore.ts`) until the tailor changes it. It is
independent of the date filter.

**Hide amounts** (the eye on the same panel) turns the To collect, Billed and
Collected totals into `₹•••••`, for when a customer is at the counter, and is
remembered on the phone (`storage/amountsHiddenStore.ts`). The amounts on the bills
in the list still show.

**Edit** (header of a bill) opens the same form with the bill filled in.
Saving replaces its cloth and stitching lines and works the totals out
again, but keeps its number, date and every payment — so it can't be edited
to come to less than has been paid. Payments are only ever added from
**Collect**.

**Printing — Bluetooth only.** Print opens the Print page: the Bluetooth
printers (paired with the phone, plus a search for printers nearby), the
receipt as it will come out, and one Print button. There is no system print
dialog. Tapping a printer remembers it (`storage/printerStore.ts`) and
connects to it at once; one not paired yet is paired there and then through
Android's own prompt (PIN usually 0000 or 1234). The remembered printer is
connected to as soon as the page opens, so Print starts the moment it is
tapped. **Settings → Bluetooth Printer** changes it, prints a test page, or
forgets it.

How it works: the receipt is printed the way receipt apps print it — text
in the printer's own font, 32 characters a line, and the UPI QR drawn by
the printer itself (GS ( k). `print/receiptText.ts` lays every line out to
its exact width; the Print page previews those same lines in a fixed-width
font, so preview and paper match. The printer's font is ASCII only, so ₹
prints as "Rs." and cloth names print in English. (Sending the receipt as
one big picture instead fails on many printers: they obey only the first
of its many image commands and print just the top strip.) The bytes go out
through the app's own native module, `modules/bluetooth-printer` (Android,
Kotlin), over whichever Bluetooth the printer speaks: Classic (SPP, most
58 mm printers) or BLE (GATT, printers that never pair). A job goes out a
line at a time, each given the time it takes to print. `print/escpos.ts`
holds the commands; `print/bluetoothPrint.ts` handles the permissions
("Nearby devices" on Android 12+, Location for searching on older phones),
a retry, and turns each failure into words the tailor can act on. Changing
the native module needs a new build of the app, not just a JavaScript
reload.

Share PDF keeps the full-page bill, which reads better on a phone.

**Delete bill** (bottom of a bill) asks first, then removes the bill with its
lines and payments in one transaction. Its number is never given out again.

**Payment QR.** A bill with money still due prints a "Scan to pay" UPI QR
with the balance filled in, and Collect payment can show it on screen. The
payee is the main app's (`print/upiQr.ts` — keep the two copies identical);
if the QR can't be built, the bank's own QR image prints instead.

A bill keeps its own copy of every name and rate it was made with, so
editing or deleting a cloth never changes a bill already given out. What has
been paid is always summed from the payments, never stored.

## Design system

All of the look lives in `src/constants/theme.ts`, and it is the look of **billing
software**, plain on purpose: a light grey page, white surfaces held by a one-pixel
border, dark neutral text, tight corners (4–8 px, no capsules), no shadows except on
the one floating button, and figures in straight columns. The main Decent Tailor
app's yellow (`#FFCE1B`) appears only where the tailor acts or has chosen — the main
button, a selected option, the field being typed in — so it always means something;
what is written on it is `onPrimary`. Status is words, not badges: green is paid,
orange is still due.

**TYPE** is Inter, semibold at the heaviest for most things and bold only for the
largest figures, with no decorative letter-spacing. Headings are plain text on a
grey band (`Section`), not icon tiles. **A bill is drawn as a bill**
(`components/bill/BillDocument.tsx`): letterhead, number and date, who it is for,
tables of quantity, rate and amount, and ruled-off totals; the Bills list is a
ledger, and a table on a tablet. Screens never use raw colours or font weights.
The launcher icon is the gold logo on **white**, where the main app's is on
near-black, so the two are told apart at a glance on a phone that has both
(`scripts/generate-brand-assets.py`).

## Cropping a design's photo

A photo for a design goes to the crop sheet as it comes in from the camera or gallery
(`pattern/PhotoCropSheet.tsx`): a box over it, whose corners and sides pull to any shape,
and which moves when dragged from inside. **Whole photo** resets it. The crop is cut from
the photo at full size and then shrunk, so a small part stays sharp (`storage/photoFiles.ts`).
The box is held as shares of the photo, and turned to pixels of the photo as it actually
loads, so a photo the phone turned upright is still cut in the right place
(`utils/photoCrop.ts`). The crop button on a photo already there crops it again, from the
saved copy, as a new file: the old one stays until the form is saved.

## Showroom mode

**Patterns → Showroom** hands the phone or tablet to a customer: the designs full
screen in midnight and champagne gold, with the tabs, header, bills and totals out of reach
(`screens/ShowroomScreen.tsx`, `pattern/DesignSlide.tsx`; its colours are `SHOWROOM` in
`theme.ts`, the same in both modes). The setup page chooses the categories (all ticked to
start), whether prices show (off to start), whether it welcomes the customer aloud
(off to start), and the 4-digit PIN (`storage/showroomPinStore.ts`). Only designs
with a photo are shown. Categories take
turns, one design each, newest first (`utils/showroom.ts`).

It opens on the shop's gold logo and tagline (`pattern/ShowroomIntro.tsx`, a tap skips it). Each
design stands in a warm light, a band of gold light crosses it now and then (`pattern/Sheen.tsx`), drifts slowly closer, and fades through up to 3 of its photos,
for 5 seconds, or 7.5 with 3 photos. The words come in one by one, a hairline shows the
time left, and the next slide glides in over about a second, its neighbours smaller and
dimmer. After the last, it goes through black to the first. On a screen on its side the
words stand beside the photo.

A finger moves the slides, a tab narrows them to one category, and a tap opens that
design's photos in 3D, holding the slideshow until closed. The back button asks for the
PIN and leaves once it is right; holding the logo in the corner for 2 seconds does the
same, for a device with no back button. The screen stays awake (`expo-keep-awake`, a
native module, so it needed a new build). Android's Home button cannot be stopped from
inside an app: **Screen pinning** in the phone's settings does that. The showroom is not
remembered, so closing the app also ends it.

**Voice** (on the same setup page, beside Price, and like it chosen afresh each time):
as the showroom opens it says “डीसेंट टेलर में आपका स्वागत है”, and 3 seconds after that
line ends, “यह हमारा कैटलॉग है, इसमें आप सारे डिज़ाइन देख सकते हैं”
(`voice/useShowroomWelcome.ts`, `voice/welcome.ts`, the lines in `voice/spokenText.ts`).
It is the same phone voice as the bill's (`expo-speech`, `hi-IN`), but follows this
switch alone, not Settings → Voice. Leaving the showroom stops it mid-word and drops
the line still to come; a tap that skips the intro does not.

**Offers** (on the same setup page, up to 3) run in the showroom as posters between the
designs, one after every 4, for 7 seconds (`utils/offers.ts`, `pattern/OfferSlide.tsx`):
the occasion, the offer set very large, a small line, and the days left. Each has its
own icon, on/off and last day, and stops by itself after that day. They are saved on the
phone (`storage/offerStore.ts`), not in a backup. An offer is only for reading: it does
not change what a bill comes to. Its colours are `OFFER` in `theme.ts`, the same in both
modes, since a poster should look the same on any phone.

## Hindi and dark mode

**Settings → App** has both, remembered in `app-settings.json` on this phone (not in
a backup). English and light until changed.

**Hindi** (`i18n/`): the English sentence is its own key, `t('Save bill')`, and
`i18n/hindi.ts` holds its Hindi. Values go in as `{0}`, `{1}`, because Hindi does not
put them where English does. A label written "Cloth · कपड़ा" needs no entry: its right
side is its Hindi. A word kept in a constant is marked `later('...')` and put through
`t()` when shown. Dates on screen come from `i18n/dates.ts`. Names the tailor typed
stay as typed. **What is printed or sent to a customer does not use `t()`**: bills,
receipts, labels, the PDF catalogue, WhatsApp messages and UPI notes read the same in
either language.

**Dark mode** (`constants/theme.ts`): `COLORS`, `CARD` and `INITIAL_TILE` hold the
values of the moment, and `themedStyles(() => ({...}))` makes every style sheet so it
can be rebuilt from them. A colour is never kept in a module-level constant. A QR stays
black on white in both modes.

`settings/appSettings.ts` applies a change, and `App.tsx` then redraws every screen by
changing the navigator's `key`, with the navigation state kept, so the tailor stays on
the same page. `i18n/coverage.test.ts` reads the source and fails on a word with no
Hindi, a word written straight into a screen, a `t()` run before a screen draws, a
document that imports `i18n/`, a colour kept in a constant, or a plain `StyleSheet.create`.

## Hindi cloth names

A cloth is shown as English plus Hindi everywhere (catalog, picker, bill,
printed bill, receipt, text). The Hindi is written from the English name as it
is typed in the cloth form (`utils/clothHindi.ts`): a vocabulary of fabric,
brand, quality and colour words first, then the main app's letter-by-letter
reading (`utils/hinglishHindi.ts`, a copy of the main app's) for anything else.
The tailor can change it by hand and the change is kept. A bill stores the
Hindi as it read when the bill was made. Cloths saved before this are shown
with the Hindi their name works out to.

The **cloth type** typed on a bill line (the New Bill field "Cloth type") gets
Hindi the same way, shown after the name's with the same dash as the English:
"Armani — Royal Blue" / "अरमानी — रॉयल ब्लू" (`clothLineHindi`). It is worked out
when shown, from what was typed, so nothing extra is stored; the field shows it
live under the box.

## Bill words in English and Hindi

The words a bill is made of (Cloth · कपड़ा, Making · सिलाई, Discount · छूट,
Total · कुल, Balance · बाकी …) are written in both languages on one line, in
one place — `constants/labels.ts` — so the New Bill summary and the saved
bill's page always call a figure the same thing. Headings that carry Hindi use
`TYPE.section`, not `TYPE.overline`: letter-spacing pulls Devanagari letters
apart on Android.

## Typing into forms

`TextField` carries the input behaviour, so every form feels the same:
`decimal={RUPEE_LIMITS}` / `METER_LIMITS` / `PERCENT_LIMITS` makes a number
field (number keyboard, `,` becomes `.`, nothing else can be typed, tapping
selects the old value); `digits={10}` is for a mobile number; `clearable`
adds a ✕. Wrap a form in `KeyboardAwareScroll` and a focused field scrolls
clear of the keyboard. Fields chain with the keyboard's Next key via refs, and
adding or removing a bill line eases with `animateNextLayout()`. The filters
live in `utils/inputFilters.ts` and are tested against the parsers they feed.

## Conventions

- **Money is integer paise** (`45050` = ₹450.50) and **cloth length is
  integer centimeters**. Parse what is typed with `parseRupees` /
  `parseMeters`, and do all bill arithmetic through `utils/billMath.ts`.
- **Schema changes are new migrations** appended to `MIGRATIONS` in
  `db/database.ts`. A shipped migration is never edited.
- **Every pressable is a `Tap`**, so presses look and feel the same
  everywhere (dip, haptic, double-tap guard).
- **Colors, sizes and text styles come from `theme.ts`**, never as raw values
  in a screen.
- **Every word on a screen goes through `t()`**, with its Hindi in `i18n/hindi.ts`,
  and every style sheet through `themedStyles`.
# decent-tailor-billiing
