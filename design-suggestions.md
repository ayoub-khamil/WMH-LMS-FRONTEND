# Design Suggestions

Future styling ideas. Nothing here is implemented; nothing here moves layout.
Adopt per-section, in any order, if and when approved.

---

## 1. Additive styling (no animation, no new layout)

Stays inside the flat watermelon/zinc language. Note the global
`* { box-shadow: none }` rule in `src/index.css` — these assume it stays.

### Login screen
- Whisper-quiet background wash: radial green-to-red tint at ~4% opacity
  behind the card. The card stays the hero; the void stops feeling empty.
- Slightly larger logo lockup with more breathing room above the title.

### Manager dashboard
- Micro status ticks: 3px colored left edge on table rows mirroring each
  row's badge (green/red/zinc). Dense but near-invisible until looked for.
- Slim stat strip above the catalog (total courses, published count,
  enrolled agents), reusing the enrollments-detail stat pattern.

### Agent dashboard
- Milestone ticks at 25/50/75 on progress bars. Same monochrome green,
  progress with texture.
- Restrained completion treatment: completed cards keep the green edge
  plus a faint green wash (`green-50/40`) so "done" reads at scroll speed.

---

## 2. Animation and visual depth

All motion must be transform/opacity-only (no layout jank) and must honor
`prefers-reduced-motion` with plain-fade fallbacks throughout.

### Prerequisite
- Replace the global `box-shadow: none` ban with an elevation scale
  (card rest, card hover lift, modal, popover). Everything below depends
  on this.

### Global (highest payoff first)
- Route fade-slide on view change.
- Modal spring-in + backdrop fade (currently pops in dead).
- Skeleton shimmer loaders replacing the "Loading…" text lines.
- Buttons: hover lift + press scale (0.97); theme toggle cross-fade.
- Slide-in treatment for inline error/success banners.

### Login
- Card entrance: fade + 12px rise on mount.
- Inputs get a soft green focus glow (shadow, not just border).

### Manager
- List stagger-in: rows/cards cascade ~30ms apart on load.
- Animated progress fills (transitions exist; add shimmer while loading).

### Agent (celebration lives here)
- Checkmark pop when a module completes; progress bar eases on mount.
- One tasteful confetti burst in the completion modal
  (e.g. canvas-confetti, single fire, no loops).
- Quiz option select spring; cooldown timer pulses softly under 60s.
