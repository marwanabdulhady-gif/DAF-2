# WordWall Activity Engine & Visual Studio

A modern, zero-dependency, modular educational activity runtime and visual builder designed to produce WordWall and LearningApps-style interactive learning activities for web applications, learning management systems (Moodle, Canvas, Google Classroom), and standalone offline HTML deliverables.

---

## 🎯 Supported Activity Mechanics

The engine includes full implementations for the 6 core activity types requested:

| Icon / Mode | Activity Type | Key Mechanics & Interactions |
|---|---|---|
| 🔗 | **Matching** | Dynamic SVG bezier connection lines, tap-to-connect nodes, drag-and-drop cards, audio-visual feedback, and instant pair verification. |
| 🔍 | **Word Search** | Automatic letter grid matrix generator (horizontal, vertical, diagonal, reverse), touch & drag highlight capsule, interactive word bank, and hint system. |
| 📖 | **Reading Comprehension** | Split-screen story reader with Web Speech API Text-to-Speech narration, paragraph indexing, highlighter annotations, and interactive quiz questions (MCQ, True/False, evidence finder). |
| 🗂️ | **Sorting & Categorizing** | Multi-bucket columns with drag-and-drop cards, tap-to-assign mobile accessibility mode, and categorized validation. |
| 📝 | **Cloze / Fill-in-the-Blank** | Paragraph text with `{word}` syntax, draggable chip bank with distractors, and inline validation. |
| 🏷️ | **Labeling Diagram** | Interactive diagram canvas (built-in SVG anatomy diagrams or custom image URLs), coordinate hotspot pins, and draggable label tags. |

### Additional Classic WordWall Game Modes Included:
- ❓ **Quiz / Gameshow**: Timed time-attack quiz with 50/50 lifeline, points streak multipliers, and combo bonuses.
- 🎡 **Spin the Wheel**: HTML5 Canvas physics wheel with authentic friction, peg-ticking audio, and winner elimination mode.
- 🔤 **Anagram / Word Unjumble**: Tactile letter tiles on a shelf with click/drag reordering and scientific clues.
- ⚡ **Speed Tap / Whack-A-Mole**: Reaction speed game where targets and distractors pop out of holes.
- 🧩 **Crossword Puzzle**: Interactive crossword grid with clue panel and keyboard navigation.
- 🃏 **Memory Match**: 3D card flipping game with matching pairs and move counters.

---

## 🚀 Quick Start Guide

### 1. Minimal HTML Embedding
```html
<!-- Include Engine Stylesheet & Scripts -->
<link rel="stylesheet" href="css/activity-engine.css">
<script src="js/sound-synth.js"></script>
<script src="js/particles.js"></script>
<script src="js/activity-engine.js"></script>

<!-- Target Container -->
<div id="game-container"></div>

<script>
  const game = new ActivityEngine('#game-container', {
    theme: 'chalkboard',
    sound: true
  });

  // Load any declarative activity config
  game.load({
    type: 'matching',
    title: 'Solar System Planetary Match',
    instruction: 'Connect each planet to its astronomical feature.',
    theme: 'default',
    timer: { enabled: true, mode: 'countup' },
    lives: 3,
    data: [
      { left: 'Mercury', right: 'Closest planet to the Sun' },
      { left: 'Venus', right: 'Hottest planet with toxic atmosphere' },
      { left: 'Mars', right: 'The Red Planet with iron oxide soil' }
    ]
  });

  // Event Listeners
  game.on('score', (e) => console.log('Score:', e.score));
  game.on('complete', (summary) => console.log('Completed:', summary));
</script>
```

---

## 🎨 Visual Themes

The engine comes with 7 built-in themes:
- `theme-default`: Modern clean slate with vibrant indigo accents
- `theme-chalkboard`: Classic green classroom slate with chalk styling
- `theme-arcade`: Cyberpunk 80s neon synthwave with glowing borders
- `theme-sunset`: Warm coral & tangerine palette
- `theme-forest`: Soothing sage and emerald green
- `theme-kids`: High-contrast, playful pastel with bubbly rounded cards
- `theme-midnight`: Dark mode optimized for OLED and late-night study

---

## 📋 Activity JSON Schemas

### 1. Matching (`type: "matching"`)
```json
{
  "type": "matching",
  "title": "Title",
  "instruction": "Instructions for students",
  "theme": "default",
  "lives": 3,
  "timer": { "enabled": true, "mode": "countup" },
  "data": [
    { "left": "Prompt / Term", "right": "Matching Definition" }
  ]
}
```

### 2. Word Search (`type: "wordsearch"`)
```json
{
  "type": "wordsearch",
  "title": "Title",
  "theme": "forest",
  "timer": { "enabled": true, "mode": "countdown", "seconds": 120 },
  "data": {
    "gridSize": 10,
    "words": ["CHLOROPHYLL", "STOMATA", "GLUCOSE", "OXYGEN"]
  }
}
```

### 3. Reading Comprehension (`type: "reading"`)
```json
{
  "type": "reading",
  "title": "Title",
  "theme": "sunset",
  "data": {
    "passageTitle": "Passage Title",
    "passageText": "Paragraph 1...\n\nParagraph 2...",
    "questions": [
      {
        "question": "Question text?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "answerIndex": 1,
        "explanation": "Why this answer is correct."
      }
    ]
  }
}
```

### 4. Sorting & Categorizing (`type: "sorting"`)
```json
{
  "type": "sorting",
  "title": "Title",
  "data": {
    "categories": [
      { "id": "solid", "title": "Solid", "color": "#3b82f6", "icon": "🧊" },
      { "id": "liquid", "title": "Liquid", "color": "#06b6d4", "icon": "💧" }
    ],
    "items": [
      { "text": "Ice", "categoryId": "solid" },
      { "text": "Water", "categoryId": "liquid" }
    ]
  }
}
```

### 5. Cloze / Fill in the blank (`type: "cloze"`)
```json
{
  "type": "cloze",
  "title": "Title",
  "data": {
    "text": "The {sun} rises in the {east} and sets in the {west}.",
    "distractors": ["moon", "north", "south"]
  }
}
```

### 6. Labeling Diagram (`type: "diagram"`)
```json
{
  "type": "diagram",
  "title": "Title",
  "data": {
    "diagramSvg": "<svg ...>...</svg>",
    "imageUrl": "https://example.com/diagram.png",
    "labels": [
      { "id": "p1", "name": "Petal", "x": 230, "y": 95 },
      { "id": "p2", "name": "Stem", "x": 300, "y": 220 }
    ]
  }
}
```

---

## 🛠️ Offline Standalone Single-File HTML Generator

You can export any activity into a completely self-contained `.html` file that:
1. Inlines all styles, scripts, sound synthesizer, and particle physics
2. Requires 0 network requests
3. Can be double-clicked on any computer or mobile device to play offline
4. Can be uploaded directly into Moodle, Canvas, Google Drive, or any web host.
