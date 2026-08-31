#!/usr/bin/env python3
"""Dar Al Fikr Grade 4 Mathematics Learning Hub Builder
Indexes curriculum, ensures assets, and prepares data for runtime.
"""
from pathlib import Path
import json
import re

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
SLIDES = ROOT / "slides"
OUT = HERE / "data" / "curriculum.json"

TOPIC_META = [
    {"topic": 1, "gate_ar": "ساحة المصباح", "gate_en": "Lantern Court", "title": "Generalize Place Value Understanding", "guild": "Census Guild", "lead": "Jadd Tariq", "color": "#00bed6", "twin": "Place-Value Cups & Glass Marbles (Base 10 grouping)", "commission": "School Census Record: Survey Grade 4 student population, group by tens/hundreds, and draft the caravan register.", "badge": "🏮"},
    {"topic": 2, "gate_ar": "ديوان الحساب", "gate_en": "Counting House", "title": "Fluently Add and Subtract Multi-Digit Whole Numbers", "guild": "Treasury & Weights", "lead": "Abu Layth", "color": "#17b8be", "twin": "Brass Two-Pan Balance & Date Seed Counterweights", "commission": "Recycling Weigh-in Audit: Weigh cardboard and plastic bales, calculate sums, differences, and net valley cargo.", "badge": "⚖️"},
    {"topic": 3, "gate_ar": "نخيل يوسف", "gate_en": "Palm Nursery", "title": "Use Strategies and Properties to Multiply by 1-Digit Numbers", "guild": "Date Palm Nursery", "lead": "Amm Mansoor", "color": "#2ec4b6", "twin": "Pegboard Matrix & Colored Elastic Bands (Area Arrays)", "commission": "Date Nursery Planting Grid: Plot 8 irrigation rows with 240 palm saplings each and verify yield using partial products.", "badge": "🌴"},
    {"topic": 4, "gate_ar": "مشغل القوافل", "gate_en": "Caravan Workshop", "title": "Use Strategies and Properties to Multiply by 2-Digit Numbers", "guild": "Logistics & Harnesses", "lead": "Amm Basil", "color": "#38bdf8", "twin": "Cuisenaire Rod Grids & Segmented Base-10 Tiles", "commission": "Caravan Load Box Grid: Calculate weight distributions for 24 camels carrying 35 standard sacks each.", "badge": "🐪"},
    {"topic": 5, "gate_ar": "قسمة الماء", "gate_en": "Water Share", "title": "Use Strategies and Properties to Divide by 1-Digit Numbers", "guild": "Hydrology & Cisterns", "lead": "Khalid al-Muhandis", "color": "#0ea5e9", "twin": "Volumetric Graduated Beakers & Pipettes (Water Division)", "commission": "Solar Desalination Still: Measure condensation yield, divide evenly among cisterns, and interpret remaining liters.", "badge": "💧"},
    {"topic": 6, "gate_ar": "سوق السؤال", "gate_en": "Hidden Question", "title": "Use Operations with Whole Numbers to Solve Problems", "guild": "Merchant Chamber", "lead": "Abu Faris", "color": "#6366f1", "twin": "Strip Diagram Tape Ribbons & Market Price Slates", "commission": "Market Day Souq Budget: Manage stall inventory, track multi-step sales, compute hidden costs, and settle trade books.", "badge": "📜"},
    {"topic": 7, "gate_ar": "بيت التمر", "gate_en": "Seed Room", "title": "Factors and Multiples", "guild": "Harvest Sorting", "lead": "Jadd Tariq", "color": "#8b5cf6", "twin": "Square Tile Grid Array Boards (Prime vs Composite)", "commission": "Date Crate Factor Sorting: Package 36 and 48 dates into all rectangular factor arrays and identify prime batches.", "badge": "📦"},
    {"topic": 8, "gate_ar": "صحن الظل", "gate_en": "Same Water", "title": "Extend Understanding of Fraction Equivalence and Ordering", "guild": "Solar & Shadow Surveyors", "lead": "Khala Samira", "color": "#a855f7", "twin": "Magnetic Transparent Fraction-Tiles & Fraction-Towers", "commission": "Courtyard Shadow Fraction Map: Measure shadow lengths at solar noon, generate equivalent fraction ratios on number lines.", "badge": "☀️"},
    {"topic": 9, "gate_ar": "صفة الإفطار", "gate_en": "Join and Take", "title": "Understand Addition and Subtraction of Fractions", "guild": "Hospitality & Rations", "lead": "Amm Bilal", "color": "#ec4899", "twin": "Segmented Food Sharing Platters & Colored Magnetic Fraction Rings", "commission": "Iftar Share Platters: Decompose flatbreads, add mixed number portions, and subtract rations for the valley journey.", "badge": "🍲"},
    {"topic": 10, "gate_ar": "قربة الجزء", "gate_en": "Many Shares", "title": "Extend Multiplication Concepts to Fractions", "guild": "Water Skin Provisioners", "lead": "Khalid al-Muhandis", "color": "#f43f5e", "twin": "Calibrated Water Skins & Unit Fraction Fill Cups", "commission": "Stopwatch Time Trial & Rations: Multiply unit fractions of water per caravan trek hour and solve elapsed time trials.", "badge": "⏱️"},
    {"topic": 11, "gate_ar": "درب الأثر", "gate_en": "Rain Marks", "title": "Represent and Interpret Data on Line Plots", "guild": "Valley Trackers", "lead": "Abu Layth", "color": "#f97316", "twin": "Wooden Measuring Rulers & Peg Line Plot Pegboard", "commission": "Hand Span Line Plot Study: Measure student palm spans in fractional eighth-inches, construct line plots, and analyze spreads.", "badge": "📏"},
    {"topic": 12, "gate_ar": "دكان الهللة", "gate_en": "Small Coins", "title": "Understand and Compare Decimals", "guild": "Mint & Coinage", "lead": "Abu Faris", "color": "#eab308", "twin": "Hundredth Grid Slates & Decimal Currency Coins (SAR & Halalah)", "commission": "Souq Cashier Register: Convert fractions with tenths/hundredths to decimal currency and compare ledger values.", "badge": "🪙"},
    {"topic": 13, "gate_ar": "ميزان الذراع", "gate_en": "Measure House", "title": "Measurement: Find Equivalence in Units of Measure", "guild": "Master Builders", "lead": "Amm Basil", "color": "#84cc16", "twin": "Trundle Wheel, Yardstick & Metric Caliper Kit", "commission": "School Perimeter & Area Survey: Measure classroom and courtyard dimensions in metric and customary units.", "badge": "📐"},
    {"topic": 14, "gate_ar": "سلسلة النجم", "gate_en": "Rule Room", "title": "Algebra: Generate and Analyze Patterns", "guild": "Mosaic Guild", "lead": "Khala Samira", "color": "#10b981", "twin": "Geometric Mosaic Pattern Blocks & Number Sequence Strips", "commission": "Star Band Repeating Mosaic: Design geometric mosaic borders using algebraic number rules and repeating shapes.", "badge": "✨"},
    {"topic": 15, "gate_ar": "المزولة", "gate_en": "Turning Gate", "title": "Geometric Measurement: Understand Concepts of Angles and Angle Measurement", "guild": "Observatory & Dial Masters", "lead": "Khala Samira", "color": "#06b6d4", "twin": "Brass 360° Rotating Protractors & Gnomon Shadow Pins", "commission": "Courtyard Sundial Build: Measure solar ray angles with protractors, calculate additive angles, and calibrate shadow marks.", "badge": "🧭"},
    {"topic": 16, "gate_ar": "قبة الثمانية", "gate_en": "Shape Yard", "title": "Lines, Angles, and Shapes", "guild": "Grand Architects", "lead": "Jadd Tariq", "color": "#00bed6", "twin": "Geoboards & Mirrored Symmetry-Plates", "commission": "Capstone 8-Point Star Pavilion: Construct symmetrical 8-point geometric polygons, classify triangles and quadrilaterals.", "badge": "🏛️"}
]

def clean(text):
    text = re.sub(r"\[`?([^\]`]+)`?\]\([^)]*\)", r"\1", text)
    text = text.replace("**", "").replace("`", "")
    return re.sub(r"\s+", " ", text).strip(" ·")

def field(body, label):
    m = re.search(r"\*\*" + re.escape(label) + r"\*\*(.+)", body)
    return clean(m.group(1)) if m else ""

def parse_lesson(path, semester):
    body = path.read_text(encoding="utf-8")
    head = re.search(r"^#\s*Lesson\s+([\d.\-]+)\s*[—–-]\s*(.+)$", body, re.M)
    if not head:
        head = re.search(r"^#\s*(.+)$", body, re.M)
        if head:
            title = clean(head.group(1))
            parts = path.stem.split("-")
            code = parts[0] + "-" + parts[1]
        else:
            return None
    else:
        code = head.group(1).replace(".", "-").strip()
        title = clean(head.group(2))

    topic_m = re.search(r"\*\*Topic\s+(\d+):\*\*\s*(.+)", body)
    topic_no = int(topic_m.group(1)) if topic_m else int(code.split("-")[0])
    topic_title = clean(topic_m.group(2)) if topic_m else ""

    week_m = re.search(r"\*\*Pacing:\*\*.*?Week\s*(\d+)", body)
    gate_m = re.search(r"\*\*([^*]+?)\*\*\s*·\s*\*\*Door\s*[\d\-]+\*\*\s*·\s*Rifqah\s*\*\*([^*]+)\*\*", body)

    prod = {}
    for letter in ("A", "B"):
        pm = re.search(r"^\|\s*\*\*" + letter + r"\*\*\s*\|\s*(.+?)\s*\|\s*$", body, re.M)
        if pm:
            prod[letter] = clean(pm.group(1))

    optional = "optional" in path.stem or "as-time-allows" in path.stem
    meta = TOPIC_META[topic_no - 1] if 1 <= topic_no <= len(TOPIC_META) else None

    return {
        "code": code,
        "title": title,
        "semester": semester,
        "topic": topic_no,
        "topicTitle": topic_title or (meta["title"] if meta else f"Topic {topic_no}"),
        "week": int(week_m.group(1)) if week_m else None,
        "optional": optional,
        "path": f"../{path.relative_to(ROOT).as_posix()}",
        "objective": field(body, "I can…") or f"Master concepts for Door {code}",
        "place": clean(gate_m.group(1)) if gate_m else (meta["gate_en"] if meta else ""),
        "rifqah": clean(gate_m.group(2)) if gate_m else (meta["lead"] if meta else "al-Misbah"),
        "hook": field(body, "Open (20 sec):") or field(body, "Solve & Share Act 1:") or "The caravan pauses at the gate.",
        "setting": field(body, "Where / who:") or (meta["guild"] if meta else ""),
        "task": field(body, "He does:") or f"Solves Door {code} challenges",
        "twin": meta["twin"] if meta else "Concrete manipulative twin",
        "commission": meta["commission"] if meta else "Vocational commission",
        "production": prod if prod else {
            "A": f"Master Sijill Entry for Door {code}",
            "B": f"Creative Transfer Challenge for Door {code}"
        },
        "deck": None,
    }

def parse_pacing():
    pacing_file = ROOT / "PACING.md"
    if not pacing_file.exists():
        return []
    text = pacing_file.read_text(encoding="utf-8")
    weeks, semester = [], 0
    for line in text.splitlines():
        if re.search(r"##\s*Semester\s*1", line):
            semester = 1
        elif re.search(r"##\s*Semester\s*2", line):
            semester = 2
        row = re.match(r"\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|", line)
        if row and semester:
            w_num = int(row.group(1))
            focus = row.group(2).strip()
            codes = [c.replace(".", "-") for c in re.findall(r"(\d+\.\d+)", focus)]
            weeks.append({
                "semester": semester,
                "week": w_num,
                "focus": clean(focus),
                "codes": codes,
            })
    return weeks

def main():
    lessons = []
    for semester in (1, 2):
        folder = ROOT / f"semester{semester}" / "lessons"
        if folder.exists():
            for path in sorted(folder.glob("*.md")):
                lesson = parse_lesson(path, semester)
                if lesson:
                    lessons.append(lesson)

    decks = {}
    if SLIDES.exists():
        for deck in sorted(SLIDES.glob("door-*.html")):
            code = deck.stem.replace("door-", "")
            decks[code] = f"../slides/{deck.name}"
    for lesson in lessons:
        lesson["deck"] = decks.get(lesson["code"])

    def order(lesson):
        parts = lesson["code"].split("-")
        try:
            return (lesson["semester"], int(parts[0]), int(parts[1]) if len(parts) > 1 else 0)
        except ValueError:
            return (lesson["semester"], 999, 0)

    lessons.sort(key=order)

    extras = [
        {"name": "Wadi Map", "file": "../slides/wadi-map.html", "note": "The year map — fills as doors are sealed."},
        {"name": "Experiences", "file": "../slides/EXPERIENCES.html", "note": "The unique job behind every door."},
        {"name": "Production", "file": "../slides/PRODUCTION.html", "note": "Stage 6 Stone A or B, with the rubric."},
        {"name": "Period Hive", "file": "../slides/period-hive.html", "note": "Practice slips for Stage 3."},
        {"name": "Night Zero", "file": "../slides/night-zero.html", "note": "The four-minute opening tale."}
    ]

    gates = []
    for meta in TOPIC_META:
        topic_no = meta["topic"]
        gate_lessons = [l["code"] for l in lessons if l["topic"] == topic_no]
        gates.append({
            "topic": topic_no,
            "name": meta["gate_en"],
            "nameAr": meta["gate_ar"],
            "title": meta["title"],
            "guild": meta["guild"],
            "lead": meta["lead"],
            "doors": len(gate_lessons),
            "color": meta["color"],
            "badge": meta["badge"],
            "twin": meta["twin"],
            "commission": meta["commission"]
        })

    data = {
        "school": "Dar Al Fikr Boys School, Jeddah",
        "motto": "Faith, Righteousness and Wisdom",
        "mottoAr": "الإيمان والاستقامة والحكمة",
        "course": "enVision Mathematics — Grade 4",
        "year": "2026–2027",
        "lessons": lessons,
        "weeks": parse_pacing(),
        "gates": gates,
        "extras": extras,
        "counts": {
            "lessons": len(lessons),
            "decks": len(decks),
            "topics": 16,
            "weeks": len(parse_pacing())
        }
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(lessons)} lessons · {len(decks)} decks · {len(data['weeks'])} weeks -> {OUT.relative_to(ROOT)}")

if __name__ == "__main__":
    main()
