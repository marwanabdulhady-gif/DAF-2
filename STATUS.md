# Status — Dar Al Fikr Grade 4 Mathematics Ecosystem

**Academic Year:** 2026–2027  
**School:** Dar Al Fikr Boys School, Jeddah  
**Course:** enVision Mathematics — Grade 4 (16 Topics · 98 Lessons · 38 Weeks)  
**Last Updated:** 2026-08-31

---

## 🎨 Visual Identity & Design System

- **Brand Primary Cyan:** `#00bed6` (vibrant signature), `#0e8f94` (deep teal), `#38effa` (neon aqua glow)
- **Canvas Base:** `#050f13` (obsidian midnight dark mode) / `#f2f8f9` (pearl crisp light mode)
- **Sovereign Gold Accent:** `#d4af37` (gold), `#f6d872` (lit amber)
- **Chrome & Architecture:** Glassmorphism with `backdrop-filter: blur(16px)`, 12px corner radii, Poppins display, Inter body, and Space Mono for numerals.
- **Official Brand Mark:** 8-Point geometric Arabic calligraphy star ("دار الفكر") + *"DAR AL FIKR SCHOOLS · Faith, Righteousness and Wisdom / الإيمان والاستقامة والحكمة"*.

---

## 🏛️ Ecosystem Architecture & Deliverables

### 1. The Learning Hub (`/hub/`)
- **`hub/index.html`:** The unified front door application connecting all curriculum lessons, interactive tools, and classroom ledgers.
- **`hub/hub.css`:** Full Fikr platform design system styling with responsive drawer, dark/light theme switcher, and A5 print stylesheets.
- **`hub/hub.js`:** Single-page client engine featuring:
  - **🗺️ Live Interactive Wadi Map:** Real-time SVG serpentine canyon with caravan walk animation, dynamic water hydration filling, and instant Gate Dossier drawers.
  - **▤ 98 Lessons Catalog:** Multi-criteria filter matrix by Semester (1 / 2), Gate (1–16), Status (Sealed / Open), and Vocational Guild.
  - **🕹️ Mini-Games & Arcades:** 
    * *Lantern Drill $\times 2$–$\times 12$ Sitr Trainer* (private practice mode + golden pebble accumulator).
    * *Period Hive Base-10 Game* (place-value balancing puzzles).
    * *Misbah Stage 4 AI Critic Arena* (desert mathematical dilemma diagnosis).
    * *Dakkan al-Halalah Cashier* (real-time SAR / Halalah trade calculation).
  - **📜 Stage 6 Student Portfolios:** Dual Production Pathway A (Vocational Artifact) & Pathway B (Creative Transfer) generator with printable A5 Sijill parchment certificates.
  - **◎ Caravan Collective Tracking:** Non-competitive communal pebble vessel, 16 Gate Sijill rings, Sitr private mastery self-assessments, and Dojo P teacher clipboard.
  - **▦ 38-Week Pacing Calendar:** Structured yearly roadmap.
  - **▣ Research & Activity Atlas:** CommonMark markdown document reader for foundational pedagogy.
- **`hub/build_hub.py`:** Standalone curriculum indexer parsing lesson files and PACING.md into `data/curriculum.json`.
- **`hub/data/curriculum.json`:** Canonical JSON dataset.
- **`hub/assets/daf-logo.png` & `daf-star.png`:** High-resolution official school logos.

### 2. Interactive Slides & Companion Decks (`/slides/`)
- **`slides/wadi-map.html`:** Fullscreen standalone valley map with Web Audio synthesizer, caravan march, and gate seals.
- **`slides/EXPERIENCES.html`:** Master Vocational Activity Atlas (91 unique jobs & concrete twins).
- **`slides/PRODUCTION.html`:** Stage 6 A5 Print Studio and Master AI Critic rubrics.
- **`slides/period-hive.html`:** Stage 3 interactive place-value puzzle slips.
- **`slides/night-zero.html`:** 4-minute foundation lore deck.
- **`slides/door-6-2.html`:** Flagship projector lesson deck with interactive 2D activity verbs.

### 3. Curriculum Source Files
- **`/semester1/lessons/`:** 48 Markdown lesson specifications (Topics 1–8).
- **`/semester2/lessons/`:** 50 Markdown lesson specifications (Topics 8–16).
- **`/PACING.md`:** 38-week pacing guide across Semesters 1 and 2.
- **`/WADI_ACTIVITY_ATLAS.md`:** Master playbook for concrete twins, 2D game verbs, and STEM commissions.

---

## 🔒 Locked System Invariants

1. **Printed numbers are locked:** All textbook figures come strictly from printed assets; measured data belongs to the students.
2. **FIKR Clock (Stages 0–6):** 40-minute pacing trims with dedicated pedagogical phases.
3. **Lantern Drill $\times 2$–$\times 12$ runs every period:** Sitr (private mastery) without public ranking.
4. **Misbah never names digits:** AI serves as critic only in Stage 4, never author.
5. **No public leaderboards:** Collective class progression via the communal caravan pebble bowl.
6. **Dojo P:** Teacher observation clipboard only.
7. **Offline Integrity:** Zero external CDN dependencies. All fonts, styles, sounds, and assets run locally.
8. **Currency & Leads:** SAR currency; leads: *Amm, Abu, Jadd, Amma, Khal, Khala, Jadda* (No *Umm*).
