# Mednevo — Period Tracker Setup

An 11-step onboarding flow for a menstrual cycle tracker, built with React 19, TypeScript (strict), Tailwind CSS v4 and Lucide icons. It uses a white, pink-first theme.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # strict typecheck + production build
```

## Flow

0. **Welcome page** (`WelcomePage.tsx`): a hero with the only CTA ("Get Started", which opens Step 1), then "Make tracking work for you" with exactly four feature cards. The page ends there. The hero visual is a fixed 640×460 composition scaled to its column, so the floating cards never leave it. The hero photo slot is `src/assets/welcome/hero-woman.webp` (a realistic adult woman using a smartphone). Add that file and it's bundled and used automatically, with no request made while it's absent; until then the approved guide is shown in the same spot.

1. Eleven steps, each with a question on the left and a contextual illustration on the right.
2. Review, where every section has an Edit button that jumps back to its step. While editing, **Save & review** (desktop/tablet) or **Save & return to review** (phones) validates the step and returns to Review.
3. Confirmation modal (focus-trapped; Esc closes it and returns focus to **Set Up My Tracker**).
4. Loading.
5. Success.
6. Dashboard. From here, "Edit setup" reopens the flow at Review with all data intact.

## Structure

```
src/
  App.tsx                 # welcome ⇄ onboarding ⇄ dashboard; resume / start over
  OnboardingFlow.tsx      # single typed state, navigation, validation, modal → loading → success
  types.ts / constants.ts # OnboardingData, options, copy, step helpers (no numeric casts)
  lib/health.ts           # BMI (validBmi / bmiVisualKey), range feedback, dates, tracking defaults
  lib/validation.ts       # per-step validation → inline errors (keyed by OnboardingData fields)
  lib/progress.ts         # saved progress: strict field-by-field restore, resume, completion
  hooks/                  # useCountUp, usePrefersReducedMotion, useElementHeight, useStepSpacing
  components/
    WelcomePage           # landing page: hero + four feature cards + Welcome back card
    OnboardingLayout      # Mednevo header; "page" or "fixed" (no-scroll) mode
    ProgressStepper / MobileProgress / StepHeader / NavigationButtons
    OptionCard (+ radiogroup arrow keys, roving tabindex) / SelectChip / ToggleCard / SliderInput
    DateWheel / DatePicker / CalendarDialog / StartOverDialog / ConfirmationModal
    CycleStepVisual       # the right-hand panel: scene + glass decor + guide, step choreography
    StepScenes            # 11 data-reactive contextual scenes
    visuals/              # primitives (SceneCanvas, SceneBox…), GlassWellnessDecor, guidePlacement,
                          # StepVisualPanel, GirlCharacter, CycleOrb
    Dashboard / ReviewSection / LoadingState / SuccessState
  steps/                  # Step1 … Step11
  assets/cycle-tracker/   # girl artwork + stepVisuals.ts (the only step → artwork map)
```

## Glass wellness decor

`GlassWellnessDecor.tsx` adds a soft 3D-glass atmosphere behind every step's visual, built from four
small pieces: `GlassOrb` (frosted sphere with rim, refraction ring, specular glint and a soft pink
inner glow), `FloatingMedicalIcon` (a gradient-shaded glyph inside the orb), `GlassParticle` and
`HolographicRing`.

- **Additive and behind everything**: it renders at `z-0` inside the scene canvas, under the
  contextual scene and the guide. Nothing existing was removed.
- **Contextual**: three icons per step that belong to that step only (e.g. Notifications → bell,
  calendar, drop; Fertility → heart, egg, calendar).
- **Placed from real geometry**: positions are computed from the same numbers the scene box and the
  guide use, so the glass only occupies areas both leave free. Measured on all 11 steps: 0% overlap
  with the guide or any scene card, nothing outside the panel.
- **Density by device**: desktop 3 orbs + ring + up to 5 particles; tablet 2 smaller orbs + 3
  particles; the phone strip 1 small orb + 1 particle.
- **Motion**: transform/opacity only, 6–12s cycles with different durations and delays; stopped by
  `prefers-reduced-motion`. Decorative only — `aria-hidden`, nothing focusable, gradient ids scoped
  per instance with `useId`.

## Step 1: date wheel

The date is chosen with a three-column wheel (day / month / year) built on native scroll-snap, so
touch, trackpad and mouse wheel all work; arrow keys and direct clicks are handled too, and a
programmatic-scroll flag keeps the settle handler from "selecting" rows the wheel merely passes. The
day column follows the month, and a day that cannot exist (31 → February) clamps to the month's last
day, so the value is never invalid. The year column ends at the current year (a last period can't be
in the future) and always includes the saved year. The calendar dialog and "Today" remain as shortcuts, and all three
— wheel, summary and the right-hand visual — read from the same date. Preferred Language was removed
from this step, including its state and validation.

## Saved progress and Resume Journey

Setup progress is persisted to `localStorage` under `mednevo.onboarding.progress` as one typed object
(`currentStep`, `completedSteps`, the full answer set, `updatedAt`) — see `lib/progress.ts`.

- **Saves on every meaningful change**, not just on Continue, so leaving mid-step loses nothing. An
  untouched Step 1 is deliberately *not* saved — otherwise the page would offer to resume a journey
  with no answers in it.
- **The welcome page never auto-jumps.** With saved progress it swaps the CTA for a compact
  "Welcome back / You're on Step N of 11 / % complete" card, **Resume Journey** and **Start Over**.
  Everything else on the page is unchanged.
- **Start Over** asks for confirmation first, then clears only this key.
- **Finishing Step 11** clears the progress key and sets `mednevo.onboarding.completed`, so the
  welcome page goes back to "Get Started".
- **Corrupt or foreign payloads** (bad JSON, wrong shape, unknown step) are dropped silently and the
  app starts fresh — no crash, no console error. Restore is field-by-field and cast-free: every value is
  checked against its real type and unions against their allowed members, so an outdated or tampered
  value (e.g. a 7-day reminder saved before the 1/3/5 options, or a height stored as text) falls back
  to its default instead of entering state.

## Step 1: calendar dialog

The full month grid lives in `CalendarDialog.tsx` (grid: `DatePicker.tsx`) and opens on demand from the
"Calendar" row beside **Today**. Inside the dialog, **Today** sits beside the "Select date" title and the
month/year row uses short month names (`Sep`), so the header fits on one line at every width from 320px
up (measured: 0px overflow, both arrows inside and clickable). The dialog renders through a portal on `<body>`: the step card animates with a transform, which would
otherwise become the containing block for `position: fixed` and push the dialog off-centre. Picking a
day (or "Today") commits and closes; "Select" commits the day the arrow keys moved to; Cancel, Escape
and an outside click close without changing the saved date. Width is capped at
`min(360px, 100vw - 32px)`, so it always fits a phone.

## Type scale and radii

Every UI text size comes from named tokens in `index.css` (`@theme`), in rem so the browser's font
size is respected. There are no ad-hoc pixel sizes outside the scaled scene canvases.

| Token | Size | Use |
| --- | --- | --- |
| `text-headline` | clamp 26→40px | success / dashboard headings |
| `text-title` / `text-title-sm` | clamp 21→27px / 24px | the step question (h1) / on short desktops |
| `text-section` | clamp 22→26px | page section headings, dialogs |
| `text-metric` / `text-metric-sm` | clamp 34→44px / 24px | big numbers (duration, cycle day) / BMI |
| `text-heading` | 17px | card and dialog titles |
| `text-lead` | 15px | buttons, emphasised values |
| `text-body` / `text-body-sm` | 14px / 13px | option labels, body / descriptions, labels |
| `text-caption` / `text-micro` / `text-eyebrow` | 12 / 11 / 10.4px | helper text / units / uppercase eyebrows |

Text inputs are 16px so iOS Safari never zooms on focus. Radii: `rounded-panel` (22px: question card,
visual panel, dialogs), `rounded-card` (20px: every primary card), `rounded-2xl` (16px: notes and
summaries). The only font is Inter (400–700), loaded once in `index.html`.

## Visual system: soft, low shadow

- **Shadows are barely visible**, and borders do the separation. The tokens are `shadow-glass` (0 2px 12px, 4% ink), `shadow-card-active` (0 4px 16px, 5%), `shadow-feature` (0 2px 10px, 3.5%), `shadow-glow` (buttons only: 0 4px 12px, pink at 12%) and `shadow-dialog` (0 8px 24px, 8%, dialogs only).
- **Selected is a soft blush**, not solid pink: `bg-select-bg` #FFF4F8 with `border-select-border` #F3A8C5. Segmented controls show the selected segment as a white pill with a pink ring.
- **Hover** uses #FFF9FB with a #F2BBD0 border over 150–200ms, with no lift and no glow.
- **Icons are pastel**: very light containers (#FFF0F5, lavender or lilac) with rose, lavender-pink or lilac glyphs.
- **The primary button** is #F45A9B with a very light gradient, a 18px radius and a 12% pink shadow.

## Fixed-viewport onboarding (one step = one screen)

The onboarding runs as an app screen: `OnboardingLayout mode="fixed"` gives an `h-dvh` shell with a
header, the stepper, and a main area. The page itself never scrolls.

The shell is **viewport-based** — no centred max-width container. It spans the full width with
responsive gutters only (16px phone, 24px tablet, 32px desktop, 48–64px on large screens), and the
main area is two equal columns (`md:grid-cols-2`) that stretch to the same height. The step content
keeps a 660px measure inside its card so text does not stretch on wide screens, while the card itself
still fills its half.

- **Equal-height panels.** On tablet and desktop, the question card and the guide panel stretch to the same height and fill the space between the stepper and navigation. On very tall screens (2xl) they're capped at 860px and centred. Back/Continue sit 12–16px below.
- **One vertical column per step.** Every question reads top to bottom, with no major sections side by side. Step 1 runs the date wheel, Calendar/Today, About You (Name, then Age), then the selected-date summary. Options are full-width rows. Small sub-items (medical conditions, tracking toggles, Review cards) go two per row only when the *card* is wide enough. That's a container query on the question card (`@container`, `@xs:`/`@md:`/`@lg:`), not a viewport breakpoint.
- **Content is distributed, not dumped at the top.** `useStepSpacing` measures each step's spare height and sets `--step-gap` between its logical groups (10–28px). Any remaining space is shared above and below.
- **Short screens (≤820px tall) compact automatically.** The `short:` variant tightens calendar rows, option rows, card padding and the stepper (smaller dots; the step labels stay visible on desktops ≥1280px wide and are dropped only on shorter, narrower screens such as 1024×768).
- **The guide panel recomposes to fill its shape.** `SceneCanvas` derives the canvas aspect from the panel. Wide panels use landscape: the guide bottom-left with the contextual scene across the centre and right. Tall, narrow panels use portrait: scene on top, guide below.
- **Phones use a compact, content-driven layout.** The 11-step stepper is replaced below `lg` by a compact three-row header (`STEP 5 OF 11` with the percentage on the right, then the step name, then the bar). A contextual guide strip appears under the question when there's room (at least 100px). Longer steps scroll inside the card.

Measured in headless Edge with worst-case answers (About You filled, manual duration, two conditions +
Other, two medications, custom symptom and mood, hormonal birth control, trying to conceive). The page
never scrolls and panels are always equal height; where a step is taller than the card, it scrolls inside
the card with a soft fade cue while Back/Continue stay in view:

| Viewport | Steps that scroll inside the card (worst case) |
| --- | --- |
| 1920×1080 | none |
| 1440×900 | 1 (13px), 6 (45px), 9 (26px) |
| 1536×864 | 1 (49px), 6 (81px), 9 (62px), 11 (26px) |
| 1366×768 | 1 (69px), 6 (114px), 9 (98px), 11 (46px) |
| 1024×768 | 1, 6, 9, 10, Review |
| 820×1180 | Review |
| 768×1024 | 6, 9, 10, Review |
| Phones (320–430px) | content-driven; 430×932 fits Steps 1 and 5 entirely, 320×568 scrolls most steps |

With *typical* answers (no optional profile, one condition, no medication, no custom entries) nothing
scrolls on 1440×900 and larger, and on 1366×768 only Review does (8px). Inner scrolling is intentional:
the card is `overflow-y: auto` with a fade cue, keyboard focus scrolls hidden fields into view, and the
navigation never moves.

## Guide character and step artwork

Each step has its own supplied character artwork in `src/assets/cycle-tracker/girl/`. The PNGs are the
source of truth and are never modified, recoloured or cropped. What the app imports are same-basename
WebP twins (long edge capped at 1200px): the panel never renders her wider than ~600 CSS px, and the
PNG set is ~26 MB against ~2 MB of WebP. After adding or replacing a PNG, run:

```bash
python scripts/optimize-girl-assets.py
```

`src/assets/cycle-tracker/stepVisuals.ts` is the single typed map from step to artwork, caption and alt
text — no hardcoded paths anywhere else, no external URLs:

| Step | File | Step | File |
| --- | --- | --- | --- |
| 1 Last period | `last period.png` | 7 Symptoms & mood | *(shared character)* |
| 2 Cycle length | `cycle length.png` | 8 Notifications | `notification.png` |
| 3 Period regularity | `period regularity.png` | 9 Birth control | `birth control.png` |
| 4 Period duration | `period duration.png` | 10 Fertility goals | `fertility goal.png` |
| 5 Health details | `health detail.png`, and `hieght weight.png` once height and weight are entered | 11 Review | `review.png` |
| 6 Medical info | *(shared character)* | | |

Steps 6 and 7 have no dedicated artwork yet, so they fall back to `cycle-tracker-girl.png`. Drop `medical info.png` / `symptoms mood.png` into `girl/`, regenerate the
WebP twins and point those two entries at them.

`public/assets/onboarding/period-tracker-girl.webp` is an earlier copy of the guide that the app no
longer references. It is kept as an approved asset, but because it lives in `public/` Vite copies it
into `dist/`. Delete it if you don't need it.

## Step 5: BMI-aware guide

The Step 5 guide follows the BMI category (`BmiCategory` in `src/lib/health.ts`):

| Category | BMI | Artwork file (optional) |
| --- | --- | --- |
| Underweight | < 18.5 | `girl/girl-underweight.png` |
| Normal | 18.5 – 24.9 | `girl/girl-normal.png` |
| Overweight | 25 – 29.9 | `girl/girl-overweight.png` |
| Obesity | ≥ 30 | `girl/girl-obesity.png` |

- `bmiVisualKey(height, weight)` is the only mapping from measurements to artwork. The guide panel (side panel and
  the phone strip) reads it, and it uses the same `validBmi()` as the BMI card and the
  scene dial, so the picture and the numbers can't disagree.
- The four files are discovered with `import.meta.glob`, so the app builds without them. Any category
  without a file falls back to `hieght weight.png` unchanged. The artwork is never stretched or
  squashed with CSS to fake a body type.
- A category change on the same step crossfades over 650 ms using opacity only. A step change keeps
  the quicker 260 ms hand-off.
- To add the art, drop the PNGs into `src/assets/cycle-tracker/girl/` using the names above, and keep
  the same canvas size and framing as `hieght weight.png` so she stays aligned on the scale. Then run
  `python scripts/optimize-girl-assets.py` to generate the WebP twins.

## The right-hand visual panel

Every step is a layered composition inside one panel, which is the only positioning context
(`relative` + `overflow-hidden`), so nothing can reach the question card, stepper, navigation or page
edge:

- **The contextual scene** (`StepScenes.tsx`, behind the character at `z-20`): the animated calendar,
  cycle wheel, regularity patterns, hourglass and duration ring, height ruler / scale / BMI dial,
  medical record and capsule, symptom orbit, phone with live notification cards, privacy shield,
  fertility wheel with BBT and LH panels, and the review dashboard — plus floating data chips,
  particles, flowers and holographic rings. Every scene reacts to the user's answers.
- **The character** (`z-30`): the step's own artwork, anchored to the **bottom-left** so the scene
  keeps the centre, top and right and she never covers a card. Her *box* is sized height-first
  (46–48% of the canvas by device band, width clamped to the device's width band) and the artwork is
  drawn inside it with `object-contain object-bottom`, never stretched. Each artwork has its own
  framing, so the drawn figure itself measures about 21–42% of the panel height depending on the step
  (the Step 5 scale pose is the tallest). In the portrait composition (tall, narrow panels such as
  1024×768) her height is capped to the space under the scene so she can't cover its lowest chips.
- **Scene-aware placement** (`guidePlacement.ts`): each of the 11 steps declares its own `left`
  (4–6% of the design canvas), a `scale` that trims her where a scene reaches further left (the Step 5
  ruler, the Step 7 symptom orbit) and a `lift` where a scene runs along the bottom (Steps 4 and 10).
  On desktop that puts her 5–7% from the panel edge; in the portrait composition the canvas is
  narrower than the panel, so the offset from the panel edge is larger (about 12–14% at 1024×768).
  The contextual animation always wins; she takes the space it leaves.
- **Motion**: a 5s vertical float (translateY only, no rotation or scale), a 280ms fade-and-rise when
  the artwork changes, and the step choreography (she eases aside, the scene swaps, she returns with a
  small nudge). All of it is disabled under `prefers-reduced-motion`.

## Notes

- **Contrast:** very small pink text uses `rose-ink` (`#C93477`, 4.96:1 on white). The brand `#D93D7F` is 4.27:1, so it's only used for large numbers and decorative accents.
- **Motion:** decorative animation is transform/opacity only. `prefers-reduced-motion` turns off CSS animations and the SVG (SMIL) animations.
- **Lint:** no ESLint dependency is installed in the project. The audit ran ESLint 9 externally with
  typescript-eslint recommended (21 rules active, plus `no-explicit-any` and `no-non-null-assertion` as
  errors), React Hooks (16 rules, including the React Compiler rules) and jsx-a11y recommended (34 rules):
  0 problems. A deliberately broken fixture confirmed each rule actually fires. `tsc` runs strict with
  `noUnusedLocals` and `noUnusedParameters`.

## Accessibility

Verified in headless Edge on every step at 1440×900 and 390×844:

- **Keyboard:** every radio group is a single Tab stop (roving tabindex on the checked option, or on
  every option until one is chosen); arrow keys move and select within the group. Switches toggle with
  Space. The date wheel columns are listboxes (arrow keys). Each new step moves focus to its heading.
- **Focus:** every Tab stop shows a visible indicator — the shared `focus-ring` (white gap + 50% pink
  ring); the range sliders draw the same ring on their thumb.
- **Dialogs** (calendar, Start Over, confirmation): `aria-modal`, focus trapped inside, Escape closes,
  focus returns to the button that opened them. Start Over's Escape keeps the saved progress.
- **Names and labels:** every button, switch, radio, checkbox and input has an accessible name; inputs
  are labelled; decorative art is `aria-hidden` and never focusable; images all carry `alt`; the scene
  is one `role="img"` with a step-specific label; no duplicate ids.
- **Targets:** option rows, buttons and inputs are at least 44px tall on touch screens. The 54×32 switch
  track has an invisible 8px extension, giving a measured 68×46px hit area with no overlap between
  neighbours.
- **Stepper:** going back is free; jumping forward validates the current step first, like Continue.
- **Reduced motion:** with `prefers-reduced-motion: reduce` no CSS, Web Animations or SMIL animation
  runs, and step changes swap instantly without the guide choreography.
