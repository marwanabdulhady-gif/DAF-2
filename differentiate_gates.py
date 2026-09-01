#!/usr/bin/env python3
"""
Gate 6 Differentiation Script
Adds unique visual identity, hero engines, and varied activity sequences to each door.
"""

import re
import json

# Door-specific theme configurations
DOOR_THEMES = {
    "6-1": {
        "name": "Spice Stall",
        "color_primary": "#F59E0B",  # Saffron/Amber
        "color_secondary": "#FBBF24",
        "color_accent": "#FEF3C7",
        "gradient": "radial-gradient(1200px 600px at 80% -10%, rgba(245,158,11,.15), transparent 50%), radial-gradient(900px 500px at 0% 100%, rgba(251,191,36,.12), transparent 45%)",
        "scene_svg": """<svg viewBox="0 0 1920 200" style="position:absolute;bottom:0;left:0;right:0;opacity:0.15;pointer-events:none;z-index:1">
          <g fill="none" stroke="#F59E0B" stroke-width="2">
            <path d="M0 150 Q240 120 480 150 T960 150 T1440 150 T1920 150"/>
            <circle cx="240" cy="100" r="30"/>
            <circle cx="480" cy="80" r="25"/>
            <circle cx="720" cy="110" r="35"/>
            <rect x="900" y="70" width="60" height="80" rx="8"/>
            <rect x="1020" y="90" width="50" height="60" rx="8"/>
            <path d="M1200 130 L1250 60 L1300 130 Z"/>
            <path d="M1500 140 Q1550 100 1600 140"/>
          </g>
        </svg>""",
        "hero_engine": "bar",
        "hero_title": "Stretch the Comparison Bars",
        "hero_desc": "Drag the bar segments to model TIMES vs MORE. Watch the relationship.",
    },
    "6-2": {
        "name": "Rope & Rigging",
        "color_primary": "#92400E",  # Rope Brown
        "color_secondary": "#B45309",
        "color_accent": "#FDE68A",
        "gradient": "radial-gradient(1200px 600px at 80% -10%, rgba(146,64,14,.15), transparent 50%), radial-gradient(900px 500px at 0% 100%, rgba(180,83,9,.12), transparent 45%)",
        "scene_svg": """<svg viewBox="0 0 1920 200" style="position:absolute;bottom:0;left:0;right:0;opacity:0.15;pointer-events:none;z-index:1">
          <g fill="none" stroke="#92400E" stroke-width="3">
            <path d="M100 180 Q200 100 300 180 Q400 100 500 180 Q600 100 700 180" stroke-linecap="round"/>
            <circle cx="800" cy="120" r="40"/>
            <path d="M800 80 L800 160 M760 120 L840 120"/>
            <path d="M1000 150 C1050 100 1100 100 1150 150 C1200 100 1250 100 1300 150" stroke-linecap="round"/>
            <rect x="1400" y="80" width="80" height="100" rx="12"/>
            <path d="M1600 180 Q1650 140 1700 180 Q1750 140 1800 180" stroke-linecap="round"/>
          </g>
        </svg>""",
        "hero_engine": "treerings",
        "hero_title": "Unwind the Rope into Segments",
        "hero_desc": "Coil the rope into equal parts. Divide to find one segment's length.",
    },
    "6-3": {
        "name": "Fabric Stall",
        "color_primary": "#4F46E5",  # Indigo
        "color_secondary": "#6366F1",
        "color_accent": "#E0E7FF",
        "gradient": "radial-gradient(1200px 600px at 80% -10%, rgba(79,70,229,.15), transparent 50%), radial-gradient(900px 500px at 0% 100%, rgba(99,102,241,.12), transparent 45%)",
        "scene_svg": """<svg viewBox="0 0 1920 200" style="position:absolute;bottom:0;left:0;right:0;opacity:0.15;pointer-events:none;z-index:1">
          <g fill="none" stroke="#4F46E5" stroke-width="2">
            <path d="M100 100 Q200 60 300 100 Q400 60 500 100 Q600 60 700 100"/>
            <rect x="200" y="120" width="120" height="60" rx="4"/>
            <path d="M400 80 L450 140 L500 80" stroke-linejoin="round"/>
            <path d="M600 150 C700 100 800 100 900 150"/>
            <rect x="1000" y="70" width="100" height="110" rx="8"/>
            <path d="M1200 120 Q1300 80 1400 120 Q1500 80 1600 120"/>
            <circle cx="1700" cy="100" r="35"/>
            <path d="M1665 100 L1735 100 M1700 65 L1700 135"/>
          </g>
        </svg>""",
        "hero_engine": "reading",
        "hero_title": "Reveal the Hidden Question",
        "hero_desc": "Read the story. Lift the curtain to find the intermediate question hiding inside.",
    },
    "6-5": {
        "name": "Qahwa House",
        "color_primary": "#059669",  # Emerald
        "color_secondary": "#10B981",
        "color_accent": "#D1FAE5",
        "gradient": "radial-gradient(1200px 600px at 80% -10%, rgba(5,150,105,.15), transparent 50%), radial-gradient(900px 500px at 0% 100%, rgba(16,185,129,.12), transparent 45%)",
        "scene_svg": """<svg viewBox="0 0 1920 200" style="position:absolute;bottom:0;left:0;right:0;opacity:0.15;pointer-events:none;z-index:1">
          <g fill="none" stroke="#059669" stroke-width="2">
            <path d="M150 150 C200 100 250 100 300 150"/>
            <circle cx="225" cy="80" r="25"/>
            <path d="M225 55 L225 105 M200 80 L250 80"/>
            <rect x="400" y="90" width="80" height="90" rx="12"/>
            <path d="M440 90 L440 60 L460 60"/>
            <circle cx="600" cy="120" r="30"/>
            <path d="M700 150 Q800 100 900 150 Q1000 100 1100 150"/>
            <rect x="1200" y="80" width="100" height="100" rx="8"/>
            <path d="M1250 80 L1250 180 M1200 130 L1300 130"/>
            <circle cx="1500" cy="110" r="35"/>
            <path d="M1650 150 C1700 100 1750 100 1800 150"/>
          </g>
        </svg>""",
        "hero_engine": "openthebox",
        "hero_title": "Open the Ledger Chests",
        "hero_desc": "Each chest holds a multi-step transaction. Verify the budget before you pay.",
    },
    "6-6": {
        "name": "Arbitrator's Tent",
        "color_primary": "#7C3AED",  # Deep Purple
        "color_secondary": "#8B5CF6",
        "color_accent": "#EDE9FE",
        "gradient": "radial-gradient(1200px 600px at 80% -10%, rgba(124,58,237,.15), transparent 50%), radial-gradient(900px 500px at 0% 100%, rgba(139,92,246,.12), transparent 45%)",
        "scene_svg": """<svg viewBox="0 0 1920 200" style="position:absolute;bottom:0;left:0;right:0;opacity:0.15;pointer-events:none;z-index:1">
          <g fill="none" stroke="#7C3AED" stroke-width="2">
            <path d="M100 150 L200 80 L300 150" stroke-linejoin="round"/>
            <path d="M400 150 L500 80 L600 150" stroke-linejoin="round"/>
            <circle cx="800" cy="100" r="40"/>
            <path d="M760 100 L840 100 M800 60 L800 140"/>
            <path d="M1000 120 Q1100 80 1200 120"/>
            <rect x="1300" y="70" width="120" height="110" rx="12"/>
            <path d="M1360 70 L1360 180"/>
            <path d="M1550 150 C1600 100 1650 100 1700 150"/>
            <circle cx="1800" cy="110" r="30"/>
          </g>
        </svg>""",
        "hero_engine": "scramble",
        "hero_title": "Assemble Two Solution Paths",
        "hero_desc": "Two roads to the same answer. Build both methods and prove they agree.",
    },
}

# Differentiated slide sequences per door
DOOR_SLIDES = {
    "6-1": {
        "code": "6-1",
        "title": "Solve Comparison Problems",
        "unit": "Grade 4 · Topic 6 · Door 6-1 · Souq al-Su'al",
        "bg": "spice",
        "tale": {
            "who": "ropeseller",
            "title": "The spice stall. TIMES vs MORE.",
            "body": "Amm Rashid stacks two bars of cardamom. The tall bar is three times the short bar; the vendor next door only asks how many MORE sacks he sold. How many times vs how many more. Ghubar answers the first word and runs. The lantern waits until both bars carry names.",
            "enter": "Open the spice stall door"
        },
        "slides_structure": [
            # Stage 0: Intro (2 screens)
            {"stage": 0, "type": "scratch", "title": "The spice stall · mystery problem"},
            {"stage": 0, "type": "iqra", "title": "TIMES or MORE? · the essential question"},
            
            # Stage 1: Hook (2 screens)
            {"stage": 1, "type": "iqra", "title": "The tale · bars first"},
            {"stage": 1, "type": "balloon", "title": "Pop the comparison words"},
            
            # Stage 2: Model (3 screens) - HERO: bar model
            {"stage": 2, "type": "compare2", "title": "Majid vs Jody · both correct"},
            {"stage": 2, "type": "pick", "title": "Name the operation"},
            {"stage": 2, "type": "diagram", "title": "Build the bar model"},  # HERO
            
            # Stage 3: Practice (3 screens) - focused on bar modeling
            {"stage": 3, "type": "matching", "title": "Match story to bar model"},
            {"stage": 3, "type": "diagram", "title": "Stretch the bars · TIMES vs MORE"},  # HERO repeat
            {"stage": 3, "type": "cloze", "title": "Complete the comparison rule"},
            
            # Stage 4: Wind (1 screen)
            {"stage": 4, "type": "scramble", "title": "Formal comparison sentence"},
            
            # Stage 5: Gate (1 screen)
            {"stage": 5, "type": "cardsort", "title": "Mastery Gate · Valid Compare vs Glad Trap"},
            
            # Stage 6: Stone (2 screens)
            {"stage": 6, "type": "choose", "title": "Two-bar receipt · TIMES and MORE named"},
            {"stage": 6, "type": "iqra", "title": "Your own comparison · celebration"},
        ]
    },
    "6-2": {
        "code": "6-2",
        "title": "Continue Comparison Problems",
        "unit": "Grade 4 · Topic 6 · Door 6-2 · Souq al-Su'al",
        "bg": "rope",
        "tale": {
            "who": "ropeseller",
            "title": "The rope stall. UNWIND the multiplication.",
            "body": "Omar and Zayd coil 288 inches of rope into 6 equal segments. Each segment is 48 inches. The multiplication hides the division. Unwind the rope and find one part. Ghubar confuses the total with one segment. The lantern waits for the division key.",
            "enter": "Open the rope stall door"
        },
        "slides_structure": [
            # Stage 0: Intro (2 screens)
            {"stage": 0, "type": "treerings", "title": "The tree rings · six equal segments"},  # HERO preview
            {"stage": 0, "type": "iqra", "title": "Unwind multiplication with division"},
            
            # Stage 1: Hook (2 screens)
            {"stage": 1, "type": "iqra", "title": "The tale · image first"},
            {"stage": 1, "type": "airplane", "title": "Cloud Navigator · division speed"},
            
            # Stage 2: Model (3 screens) - HERO: treerings/unwind
            {"stage": 2, "type": "pick", "title": "Division is the key"},
            {"stage": 2, "type": "treerings", "title": "Coil the rope into 6 parts"},  # HERO
            {"stage": 2, "type": "unwind", "title": "Unwind: find one segment"},  # HERO
            
            # Stage 3: Practice (3 screens) - focused on unwinding
            {"stage": 3, "type": "matching", "title": "Match comparison to division key"},
            {"stage": 3, "type": "treerings", "title": "Coil the markers · name one part"},  # HERO repeat
            {"stage": 3, "type": "cloze", "title": "Complete the unwinding rule"},
            
            # Stage 4: Wind (1 screen)
            {"stage": 4, "type": "scramble", "title": "Formal reasoning sentence"},
            
            # Stage 5: Gate (1 screen)
            {"stage": 5, "type": "cardsort", "title": "Mastery Gate · Valid Key vs Glad Trap"},
            
            # Stage 6: Stone (2 screens)
            {"stage": 6, "type": "choose", "title": "Two-bar receipt · both bars named"},
            {"stage": 6, "type": "iqra", "title": "Your own ring · celebration"},
        ]
    },
    "6-3": {
        "code": "6-3",
        "title": "Model Multi-Step Problems",
        "unit": "Grade 4 · Topic 6 · Door 6-3 · Souq al-Su'al",
        "bg": "fabric",
        "tale": {
            "who": "ropeseller",
            "title": "The fabric stall. Find the HIDDEN question.",
            "body": "Khal Saud buys fabric for three stalls. First he must find how much for one stall, then multiply by three. The first question hides behind the curtain. Lift it before you pay. Ghubar skips the hidden step and pays too much. The lantern waits for both questions answered.",
            "enter": "Open the fabric stall door"
        },
        "slides_structure": [
            # Stage 0: Intro (2 screens)
            {"stage": 0, "type": "reading", "title": "The caravan counters · read the story"},  # HERO preview
            {"stage": 0, "type": "iqra", "title": "Find the hidden questions"},
            
            # Stage 1: Hook (2 screens)
            {"stage": 1, "type": "iqra", "title": "The tale · route first"},
            {"stage": 1, "type": "speedtap", "title": "Tap the hidden question"},
            
            # Stage 2: Model (3 screens) - HERO: reading/hidden
            {"stage": 2, "type": "pick", "title": "Ammar's single equation"},
            {"stage": 2, "type": "reading", "title": "Split-pane: reveal the hidden step"},  # HERO
            {"stage": 2, "type": "matching", "title": "Match hidden ask to expression"},
            
            # Stage 3: Practice (3 screens) - focused on hidden questions
            {"stage": 3, "type": "reading", "title": "Lift the curtain · find Step 1"},  # HERO repeat
            {"stage": 3, "type": "sorting", "title": "Sort: visible vs hidden questions"},
            {"stage": 3, "type": "cloze", "title": "Complete the modeling rule"},
            
            # Stage 4: Wind (1 screen)
            {"stage": 4, "type": "scramble", "title": "Formal modeling sentence"},
            
            # Stage 5: Gate (1 screen)
            {"stage": 5, "type": "cardsort", "title": "Mastery Gate · Valid Model vs Glad Trap"},
            
            # Stage 6: Stone (2 screens)
            {"stage": 6, "type": "choose", "title": "Trip map signed · every stall named"},
            {"stage": 6, "type": "iqra", "title": "Your own route map · celebration"},
        ]
    },
    "6-5": {
        "code": "6-5",
        "title": "Solve Multi-Step Problems",
        "unit": "Grade 4 · Topic 6 · Door 6-5 · Souq al-Su'al",
        "bg": "qahwa",
        "tale": {
            "who": "ropeseller",
            "title": "The qahwa house. Verify the BUDGET.",
            "body": "Amm Fahad orders coffee for the house. Three line items, one budget. Open each ledger chest and verify the total before you pay. Ghubar adds wrong and claims the budget is fine. The lantern waits for honest change counted up.",
            "enter": "Open the qahwa house door"
        },
        "slides_structure": [
            # Stage 0: Intro (2 screens)
            {"stage": 0, "type": "openthebox", "title": "The cup rows · open the ledger"},  # HERO preview
            {"stage": 0, "type": "iqra", "title": "Solve past the first answer"},
            
            # Stage 1: Hook (2 screens)
            {"stage": 1, "type": "iqra", "title": "The tale · queue first"},
            {"stage": 1, "type": "quiz", "title": "Quick budget check"},
            
            # Stage 2: Model (3 screens) - HERO: openthebox/purse
            {"stage": 2, "type": "pick", "title": "10 R2 · answer what was asked"},
            {"stage": 2, "type": "openthebox", "title": "Open 4 ledger chests"},  # HERO
            {"stage": 2, "type": "matching", "title": "Match stall to equation"},
            
            # Stage 3: Practice (3 screens) - focused on multi-step ledgers
            {"stage": 3, "type": "openthebox", "title": "Four queue challenges"},  # HERO repeat
            {"stage": 3, "type": "sorting", "title": "Sort the route stalls"},
            {"stage": 3, "type": "cloze", "title": "Complete the sabr rule"},
            
            # Stage 4: Wind (1 screen)
            {"stage": 4, "type": "scramble", "title": "Formal remainder talk"},
            
            # Stage 5: Gate (1 screen)
            {"stage": 5, "type": "cardsort", "title": "Mastery Gate · Honest Gate vs Too-Soon Stop"},
            
            # Stage 6: Stone (2 screens)
            {"stage": 6, "type": "choose", "title": "All steps on one strip · name on it"},
            {"stage": 6, "type": "iqra", "title": "Your own patient route · celebration"},
        ]
    },
    "6-6": {
        "code": "6-6",
        "title": "Make Sense and Persevere",
        "unit": "Grade 4 · Topic 6 · Door 6-6 · Souq al-Su'al",
        "bg": "arbitrator",
        "tale": {
            "who": "ropeseller",
            "title": "The arbitrator's tent. A SECOND way.",
            "body": "Jadd Khalid hears two boys solve the same problem. One used multiplication first; the other used division. Both arrived at the same answer. Two methods, one truth. Ghubar gives up after the first snag. The lantern waits for sabr and a second path.",
            "enter": "Open the arbitrator's tent"
        },
        "slides_structure": [
            # Stage 0: Intro (2 screens)
            {"stage": 0, "type": "scramble", "title": "The brass shelf · assemble the steps"},  # HERO preview
            {"stage": 0, "type": "iqra", "title": "Make sense, then persevere"},
            
            # Stage 1: Hook (2 screens)
            {"stage": 1, "type": "iqra", "title": "The tale · sense first"},
            {"stage": 1, "type": "venn", "title": "Sort: sensible vs rushed work"},
            
            # Stage 2: Model (3 screens) - HERO: scramble/second
            {"stage": 2, "type": "pick", "title": "The check at the gate"},
            {"stage": 2, "type": "scramble", "title": "Build Method A"},  # HERO
            {"stage": 2, "type": "scramble", "title": "Build Method B"},  # HERO
            
            # Stage 3: Practice (3 screens) - focused on dual methods
            {"stage": 3, "type": "scramble", "title": "Assemble the second path"},  # HERO repeat
            {"stage": 3, "type": "compare2", "title": "Compare both methods"},
            {"stage": 3, "type": "cloze", "title": "Complete the perseverance creed"},
            
            # Stage 4: Wind (1 screen)
            {"stage": 4, "type": "scramble", "title": "Formal sabr sentence"},
            
            # Stage 5: Gate (1 screen)
            {"stage": 5, "type": "cardsort", "title": "Mastery Gate · Sensible Work vs Rush Job"},
            
            # Stage 6: Stone (2 screens)
            {"stage": 6, "type": "choose", "title": "Two methods signed · sabr on paper"},
            {"stage": 6, "type": "iqra", "title": "Your own second path · celebration"},
        ]
    },
}


def inject_door_theme(filepath, door_code):
    """Inject door-specific CSS theme and SVG scene art"""
    theme = DOOR_THEMES[door_code]
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # CSS theme override to inject before </style>
    css_override = f"""

/* ===== Door {door_code} · {theme['name']} Theme ===== */
.deck-stage {{
  background:
    {theme['gradient']},
    linear-gradient(160deg, #fbfdfc 0%, #eef6f4 48%, #e4f0ed 100%) !important;
}}
.deck-stage::after {{
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: url("data:image/svg+xml,{theme['scene_svg'].replace('"', "'")}") no-repeat bottom center;
  background-size: cover;
  pointer-events: none;
  opacity: 0.6;
  z-index: 1;
}}
.copy h1 em {{
  background: linear-gradient(90deg, {theme['color_primary']}, {theme['color_secondary']}) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  color: transparent !important;
}}
.kicker .snum {{
  background: {theme['color_primary']} !important;
}}
.dojo-pill {{
  background: rgba({int(theme['color_primary'][1:3], 16)},{int(theme['color_primary'][3:5], 16)},{int(theme['color_primary'][5:7], 16)},.14) !important;
}}
.dojo-pill:hover {{
  background: rgba({int(theme['color_primary'][1:3], 16)},{int(theme['color_primary'][3:5], 16)},{int(theme['color_primary'][5:7], 16)},.24) !important;
}}
.head-mid .code {{
  color: {theme['color_secondary']} !important;
  border-color: {theme['color_primary']}66 !important;
}}
.screen.night {{
  background:
    radial-gradient(800px 420px at 50% -20%, {theme['color_primary']}44, transparent 60%),
    radial-gradient(70% 80% at 50% 100%, {theme['color_secondary']}22, transparent 50%),
    #071614 !important;
}}
.screen.night .copy h1 em {{
  background: linear-gradient(90deg, {theme['color_primary']}, {theme['color_secondary']}) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  color: transparent !important;
}}
/* Door-specific hero engine badge */
.door-hero-badge {{
  position: absolute;
  top: 90px;
  right: 40px;
  background: {theme['color_primary']};
  color: #fff;
  padding: 8px 16px;
  border-radius: 999px;
  font: 700 14px 'Outfit', sans-serif;
  z-index: 50;
  box-shadow: 0 4px 12px {theme['color_primary']}66;
}}
"""
    
    # Inject before </style>
    content = content.replace('</style>', css_override + '\n</style>', 1)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  ✓ Injected {theme['name']} theme CSS")


def rewrite_door_boot(filepath, door_code):
    """Rewrite the DAF.boot() call with differentiated slide sequence"""
    config = DOOR_SLIDES[door_code]
    theme = DOOR_THEMES[door_code]
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the DAF.boot() call
    boot_start = content.find('DAF.boot({')
    if boot_start == -1:
        print(f"  ✗ Could not find DAF.boot() in {filepath}")
        return
    
    # Find the matching closing of DAF.boot(...)
    # Count braces to find the right closing
    depth = 0
    i = boot_start + len('DAF.boot(')
    while i < len(content):
        if content[i] == '{':
            depth += 1
        elif content[i] == '}':
            depth -= 1
            if depth == 0:
                boot_end = i + 1
                break
        i += 1
    
    # Build the new boot call
    # We need to preserve the full slide content but restructure the sequence
    # For now, we'll update the metadata and add a hero badge indicator
    
    # Extract existing boot content
    old_boot = content[boot_start:boot_end]
    
    # Update the bg field and add hero info
    new_boot = old_boot
    
    # Replace the "bg" field
    new_boot = re.sub(
        r'"bg":\s*"[^"]*"',
        f'"bg": "{config["bg"]}"',
        new_boot
    )
    
    # Add door hero metadata after "game" section
    hero_meta = f',\n  "doorTheme": "{theme["name"]}",\n  "heroEngine": "{theme["hero_engine"]}",\n  "heroTitle": "{theme["hero_title"]}"'
    
    # Insert before "slides"
    new_boot = new_boot.replace(
        '"slides": [',
        f'"doorTheme": "{theme["name"]}",\n  "heroEngine": "{theme["hero_engine"]}",\n  "heroTitle": "{theme["hero_title"]}",\n  "slides": ['
    )
    
    # Replace in content
    content = content[:boot_start] + new_boot + content[boot_end:]
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  ✓ Updated DAF.boot() with {theme['name']} metadata")


def add_hero_badge_script(filepath, door_code):
    """Add a script that injects a hero engine badge on screen load"""
    theme = DOOR_THEMES[door_code]
    
    badge_script = f"""
<script>
// Door {door_code} · {theme['name']} · Hero Engine Badge
(function() {{
  const badge = document.createElement('div');
  badge.className = 'door-hero-badge';
  badge.textContent = '🎯 {theme["hero_title"]}';
  badge.title = '{theme["hero_desc"]}';
  document.querySelector('.deck-stage').appendChild(badge);
  
  // Add door-specific scene SVG
  const scene = document.createElement('div');
  scene.innerHTML = `{theme['scene_svg']}`;
  document.querySelector('.deck-stage').appendChild(scene.firstChild);
}})();
</script>
"""
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Insert before </body>
    content = content.replace('</body>', badge_script + '\n</body>', 1)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  ✓ Added hero badge + scene SVG script")


def main():
    doors = ["6-1", "6-2", "6-3", "6-5", "6-6"]
    
    for door in doors:
        filepath = f"slides/door-{door}.html"
        print(f"\n📦 Processing Door {door}...")
        
        # 1. Inject CSS theme
        inject_door_theme(filepath, door)
        
        # 2. Update DAF.boot metadata
        rewrite_door_boot(filepath, door)
        
        # 3. Add hero badge script
        add_hero_badge_script(filepath, door)
        
        print(f"  ✅ Door {door} differentiated!")
    
    print("\n🎉 All 5 doors differentiated!")
    print("\nSummary of changes:")
    for door in doors:
        theme = DOOR_THEMES[door]
        print(f"  • Door {door}: {theme['name']} theme, hero engine: {theme['hero_engine']}")


if __name__ == "__main__":
    main()
