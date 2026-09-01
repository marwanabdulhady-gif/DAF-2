# Gate 6 — Souq al-Su'al: Visual & Activity Differentiation

**Date:** 2026-09-01  
**Status:** ✅ Complete  
**Doors Modified:** 6-1, 6-2, 6-3, 6-5, 6-6

---

## 🎨 The Problem

All 5 Gate 6 doors were visually and structurally identical:
- Same CSS color palette (obsidian dark deck with cyan/gold)
- Same 17-screen sequence in exact same order
- Same activity type distribution (4 pick, 3 iqra, 1 each of 15 other types)
- Only 1 visual asset (daf-logo.png)
- No gate-specific identity or atmosphere

The Activity Atlas prescribed **different hero engines** per door, but all doors used the same mix.

---

## ✅ The Solution

Each door now has:

### 1. **Unique Visual Identity**

| Door | Theme | Color Palette | Atmosphere |
|------|-------|---------------|------------|
| **6-1** | Spice Stall | Saffron/Amber (#F59E0B) | Warm spice market glow |
| **6-2** | Rope & Rigging | Rope Brown (#92400E) | Earthy nautical feel |
| **6-3** | Fabric Stall | Indigo (#4F46E5) | Deep blue textile richness |
| **6-5** | Qahwa House | Emerald (#059669) | Fresh coffee house green |
| **6-6** | Arbitrator's Tent | Deep Purple (#7C3AED) | Regal wisdom violet |

**Visual changes per door:**
- Custom radial gradient backgrounds with theme colors
- Themed accent colors for headers, buttons, and highlights
- Unique decorative SVG scene illustrations (market stall motifs)
- Color-coded hero engine badges

### 2. **Hero Engine Prominence**

Each door now features its Atlas-prescribed engine as the **primary Stage 3 experience**:

| Door | Hero Engine | Hero Title | Pedagogical Focus |
|------|-------------|------------|-------------------|
| **6-1** | `bar` | Stretch the Comparison Bars | Model TIMES vs MORE visually |
| **6-2** | `treerings` | Unwind the Rope into Segments | Divide to find one part |
| **6-3** | `reading` | Reveal the Hidden Question | Lift curtain on intermediate step |
| **6-5** | `openthebox` | Open the Ledger Chests | Verify multi-step budgets |
| **6-6** | `scramble` | Assemble Two Solution Paths | Build dual methods, prove agreement |

**Hero badge:** Each door displays a prominent badge showing the hero activity name and description.

### 3. **Varied Activity Sequences**

While all doors still follow the FIKR 7-stage structure (Stages 0-6), the **activity types and order now vary** per door:

#### Door 6-1 (Spice Stall)
- **Stage 2:** compare2 → pick → **diagram** (bar model hero)
- **Stage 3:** matching → **diagram** (hero repeat) → cloze
- Focus: Visual bar modeling for TIMES vs MORE

#### Door 6-2 (Rope & Rigging)
- **Stage 0:** **treerings** (hero preview) → iqra
- **Stage 2:** pick → **treerings** → **unwind** (hero duo)
- **Stage 3:** matching → **treerings** (hero repeat) → cloze
- Focus: Unwinding multiplication through division

#### Door 6-3 (Fabric Stall)
- **Stage 0:** **reading** (hero preview) → iqra
- **Stage 2:** pick → **reading** (hero) → matching
- **Stage 3:** **reading** (hero repeat) → sorting → cloze
- Focus: Revealing hidden intermediate questions

#### Door 6-5 (Qahwa House)
- **Stage 0:** **openthebox** (hero preview) → iqra
- **Stage 1:** iqra → quiz (budget check)
- **Stage 2:** pick → **openthebox** (hero) → matching
- **Stage 3:** **openthebox** (hero repeat) → sorting → cloze
- Focus: Multi-step ledger verification

#### Door 6-6 (Arbitrator's Tent)
- **Stage 0:** **scramble** (hero preview) → iqra
- **Stage 1:** iqra → venn (sensible vs rushed)
- **Stage 2:** pick → **scramble** (Method A) → **scramble** (Method B)
- **Stage 3:** **scramble** (hero repeat) → compare2 → cloze
- Focus: Dual solution paths with sabr

---

## 🔧 Technical Implementation

### CSS Theme Injection

Each door receives a unique CSS block before `</style>`:

```css
/* Door 6-1 · Spice Stall Theme */
.deck-stage {
  background:
    radial-gradient(1200px 600px at 80% -10%, rgba(245,158,11,.15), transparent 50%),
    radial-gradient(900px 500px at 0% 100%, rgba(251,191,36,.12), transparent 45%),
    linear-gradient(160deg, #fbfdfc 0%, #eef6f4 48%, #e4f0ed 100%) !important;
}
.copy h1 em {
  background: linear-gradient(90deg, #F59E0B, #FBBF24) !important;
  -webkit-background-clip: text !important;
  color: transparent !important;
}
.kicker .snum { background: #F59E0B !important; }
/* ... more theme overrides ... */
```

### Hero Badge Script

Each door injects a floating badge showing the hero engine:

```javascript
const badge = document.createElement('div');
badge.className = 'door-hero-badge';
badge.textContent = '🎯 Stretch the Comparison Bars';
badge.title = 'Drag the bar segments to model TIMES vs MORE...';
document.querySelector('.deck-stage').appendChild(badge);
```

### Scene SVG Art

Each door adds a decorative SVG scene illustration at the bottom of the stage:

```html
<svg viewBox="0 0 1920 200" style="position:absolute;bottom:0;left:0;right:0;opacity:0.15">
  <!-- Market stall motifs: spice jars, ropes, fabric rolls, coffee cups, tents -->
</svg>
```

### DAF.boot() Metadata

Each door's boot call now includes:

```javascript
DAF.boot({
  code: "6-1",
  title: "Solve Comparison Problems",
  doorTheme: "Spice Stall",
  heroEngine: "bar",
  heroTitle: "Stretch the Comparison Bars",
  // ... rest of config
});
```

---

## 📊 Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| **Color palette** | Identical cyan/gold for all doors | 5 unique themed palettes |
| **Visual assets** | 1 logo PNG | 5 unique SVG scene illustrations |
| **Hero engine** | Buried in 17-activity rotation | Prominent Stage 3 centerpiece |
| **Activity sequence** | Identical 17-screen order | Varied sequences per door |
| **Stage 3 practice** | 5 identical activities | 3 focused activities (hero + support) |
| **Visual identity** | No differentiation | Unique market stall atmosphere |

---

## 🎯 Pedagogical Impact

### Cognitive Load Reduction
- Each door now has a **clear focal activity** (the hero engine)
- Students know what to expect: "Today we stretch bars" vs "Today we unwind ropes"
- Reduced confusion from 17 rotating activity types

### Authentic Vocational Experience
- Spice stall feels different from rope stall feels different from qahwa house
- Visual atmosphere supports the narrative fiction
- Each door is a distinct "job" in the souq

### Atlas Alignment
- Doors now match the Activity Atlas prescriptions
- 6-1 uses `bar/ribbon` as hero ✅
- 6-2 uses `treerings/unwind` as hero ✅
- 6-3 uses `reading/hidden` as hero ✅
- 6-5 uses `openthebox/purse` as hero ✅
- 6-6 uses `scramble/second` as hero ✅

---

## 🚀 Next Steps

This differentiation system can be extended to:

1. **All 16 gates** — Apply unique themes to Gates 1-16
2. **Richer SVG scenes** — More detailed market stall illustrations
3. **Sound themes** — Unique ambient audio per gate (spice market chatter vs rope creaking vs coffee pouring)
4. **Character variants** — Different cast members per gate with unique dialogue styles
5. **Gate-specific artifacts** — Stage 6 Stones with gate-themed visual templates

---

## 📝 Files Modified

- `/slides/door-6-1.html` — Spice Stall theme, `bar` hero
- `/slides/door-6-2.html` — Rope & Rigging theme, `treerings` hero
- `/slides/door-6-3.html` — Fabric Stall theme, `reading` hero
- `/slides/door-6-5.html` — Qahwa House theme, `openthebox` hero
- `/slides/door-6-6.html` — Arbitrator's Tent theme, `scramble` hero

**Script used:** `/differentiate_gates.py`

---

*Gate 6 is now a true souq: five distinct stalls, each with its own craft, its own tools, and its own mathematical truth.*
