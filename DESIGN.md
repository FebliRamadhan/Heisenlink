# Design: Heisenlink

The locked system. Every Hallmark run reads this first and pages share it. Change it on purpose; the file is the rule.

## System
- Genre: modern-minimal
- Shape of the first page: Banner + Ledger (landing); app screen (dashboard, forms)
- Theme: brand (Kementerian PANRB): the app's own neutral shadcn palette, Plus Jakarta Sans, PANRB red sampled from `public/logo-panrb.png`
- Axes: white/sans/red · posture: restrained

## Tokens
`app/globals.css` `:root` is the source of truth (shadcn HSL triplets); `app/landing.css` maps them to `--hl-*` for the landing.
```css
:root {
  --background: 0 0% 100%;   --muted: 0 0% 96.1%;        /* paper, second neutral (sidebar, table heads) */
  --foreground: 0 0% 3.9%;   --muted-foreground: 0 0% 45.1%;
  --border: 0 0% 89.8%;      --input: 0 0% 58%;          /* field edges at 3:1 */
  --primary: 0 0% 9%;        --ring: 0 0% 3.9%;          /* actions and focus are ink */
  --brand: 359 62% 43%;                                  /* PANRB red #B32A2C */
  --destructive: 0 84.2% 60.2%;
  --radius: 0.5rem;
  /* --f-*: the public form (/f/[slug]), same neutrals and face, scoped by .form-theme */
}
```
Font: Plus Jakarta Sans via `next/font` (`--font-sans`), one family everywhere, public form included.

## Colour rules
- Ink marks the primary action. Red is the brand: the current nav item (2px bar) in the app, the one primary action on the landing. Never red for app actions: it would read as destructive.
- State colours: emerald for published, amber for closed, destructive for delete. Charts are one ink hue; a single series never gets a palette.

## Controls
- Primary: ink fill · radius 0.5rem · 40px (app), 48px (landing in brand red)
- Secondary: outline or ghost · same radius and height
- Switches always carry a text state beside them ("Active" / "Off", "Published" / "Draft").

## App screens
- Shell: 56px top bar (mark, "Heisenlink", "Kementerian PANRB"); 240px sidebar on the second neutral, workspace items, an "Admin" group for admins, Settings pinned at the foot. Under md it is a sheet.
- Page: `mx-auto max-w-6xl space-y-6`; `h1` 24px semibold; one-line description under it; the primary action top right; search and secondary actions in a toolbar row.
- Tables: `rounded-lg border bg-card`, head row on `bg-muted/40`, sentence-case heads, numbers right-aligned in tabular figures, identifiers (`/code`, `/f/slug`) in mono, row actions in a menu.
- Sub-navigation (form editor, responses): underline tabs (`tabUnderline` in `components/ui/tabs.tsx`); sibling pages sit in the same strip as links.
- No card inside a card: groups inside a card are separated by a top rule.

## Data
- Figures: a stat strip (one bordered row, label, figure in tabular numerals, one-line note), never a row of icon cards. A label says what the number is ("Clicks per link", not "Avg CTR").
- Breakdowns with a handful of categories (sources, devices, browsers, systems, top links): `RankedList`, a label, a single-hue bar scaled to the share, the count and the percentage.
- Charts: `--chart-1..8` / `components/dashboard/widgets/palette.ts`, the dataviz reference palette, validated on #fff (light) and #0a0a0a (dark). One variable is one hue (slot 1, blue); categorical slots go in fixed order and a ninth category is grey "other", never a cycled hue. Bars run horizontal when labels are words; direct value labels; 2px surface gap between pie slices. One day of data is shown as a figure, not a one-point chart.

## Bio themes
- `panrb` (neutral paper, ink, PANRB red buttons) is the default for new bio pages and the fallback for unknown themes. Existing presets stay as users chose them; panels take each theme's `cardBackground`, focus rings take its text colour.

## Motion
- Character: brisk. Colour and transform only, 120 to 220ms; `motion-reduce` stops spinners and the press nudge.

## Exports
Tokens live in `app/globals.css` and `tailwind.config.js` (`brand` added). Tailwind, DTCG or shadcn blocks are added here on request.
