/* ===========================================================================
   Dar Al Fikr Schools — Grade 4 Mathematics Learning Hub
   Vanilla JS, Offline Integrity, Dynamic LocalStorage Ledgers.
   ======================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------- storage -- */
  var HUB_KEY = "daf.hub.v1";
  var SIJILL_KEY = "daf.sijill.v1";
  var CLASSES_KEY = "daf.classes.v2";

  function readJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch (e) { return fallback; }
  }
  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  var hub = readJSON(HUB_KEY, null) || { students: [], records: {}, seq: 1, pebbles: 0, sitr: {} };
  if (!hub.students) hub.students = [];
  if (!hub.records) hub.records = {};
  if (!hub.seq) hub.seq = hub.students.length + 1;
  if (!hub.sitr) hub.sitr = {};

  function saveHub() { writeJSON(HUB_KEY, hub); }
  function sijill() { return readJSON(SIJILL_KEY, {}); }
  function classes() { return readJSON(CLASSES_KEY, {}); }

  function recKey(studentId, code) { return studentId + "|" + code; }
  function record(studentId, code) { return hub.records[recKey(studentId, code)] || null; }
  function setRecord(studentId, code, patch) {
    var k = recKey(studentId, code);
    var cur = hub.records[k] || { gate: "", stone: "", xp: 0, note: "", date: "" };
    for (var p in patch) cur[p] = patch[p];
    cur.date = new Date().toISOString().slice(0, 10);
    hub.records[k] = cur;
    saveHub();
  }

  function toggleSealDoor(code) {
    var s = sijill();
    if (s[code] && s[code].done) {
      delete s[code];
    } else {
      s[code] = { done: true, date: new Date().toISOString().slice(0, 10) };
      AudioEngine.stone();
      hub.pebbles = (hub.pebbles || 0) + 1;
      saveHub();
    }
    writeJSON(SIJILL_KEY, s);
    render();
  }

  /* ---------------------------------------------------------- web audio -- */
  var AudioEngine = (function () {
    var ctx = null;
    function actx() {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ctx = new AC();
      }
      if (ctx && ctx.state === "suspended") ctx.resume();
      return ctx;
    }
    return {
      chime: function (freq, gainVal) {
        var c = actx(); if (!c) return;
        var osc = c.createOscillator(), g = c.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq || 520, c.currentTime);
        g.gain.setValueAtTime(gainVal || 0.15, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.6);
        osc.connect(g); g.connect(c.destination);
        osc.start(); osc.stop(c.currentTime + 0.6);
      },
      stone: function () {
        var c = actx(); if (!c) return;
        var osc = c.createOscillator(), g = c.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(140, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.25);
        g.gain.setValueAtTime(0.3, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.25);
        osc.connect(g); g.connect(c.destination);
        osc.start(); osc.stop(c.currentTime + 0.25);
      },
      caravan: function () {
        var c = actx(); if (!c) return;
        var osc = c.createOscillator(), g = c.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(90, c.currentTime);
        g.gain.setValueAtTime(0.08, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
        osc.connect(g); g.connect(c.destination);
        osc.start(); osc.stop(c.currentTime + 0.08);
      }
    };
  })();

  /* ---------------------------------------------------------------- util -- */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var TOPIC_COLOURS = ["--s1", "--s2", "--s3", "--s4", "--s5", "--s6", "--s7", "--s8"];
  function topicColour(n) { return "var(" + TOPIC_COLOURS[(n - 1) % TOPIC_COLOURS.length] + ")"; }
  function pct(done, total) { return total ? Math.round((done / total) * 100) : 0; }

  function download(name, text, mime) {
    var blob = new Blob([text], { type: mime || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ------------------------------------------------------------ markdown -- */
  function inline(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, function (m, c) { return "<code>" + c + "</code>"; })
      .replace(/\[([^\]]*)\]\(([^)]+)\)/g, function (m, text, href) {
        return '<a href="' + esc(href) + '">' + text + "</a>";
      })
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  }

  function splitRow(line) {
    return line.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|")
      .map(function (c) { return c.trim(); });
  }

  function md(src) {
    var lines = String(src).replace(/\r/g, "").split("\n");
    var out = [];
    var i = 0;

    function flushList(tag, items) {
      out.push("<" + tag + ">" + items.map(function (t) { return "<li>" + inline(t) + "</li>"; }).join("") + "</" + tag + ">");
    }

    while (i < lines.length) {
      var line = lines[i];
      if (/^\s*$/.test(line)) { i++; continue; }

      if (/^```/.test(line)) {
        var buf = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
        i++;
        out.push("<pre><code>" + esc(buf.join("\n")) + "</code></pre>");
        continue;
      }

      if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|?\s*$/.test(lines[i + 1])) {
        var head = splitRow(line);
        i += 2;
        var rows = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(splitRow(lines[i])); i++; }
        out.push(
          '<div class="table-wrap"><table><thead><tr>' +
          head.map(function (h) { return "<th>" + inline(h) + "</th>"; }).join("") +
          "</tr></thead><tbody>" +
          rows.map(function (r) {
            return "<tr>" + r.map(function (c) { return "<td>" + inline(c) + "</td>"; }).join("") + "</tr>";
          }).join("") +
          "</tbody></table></div>"
        );
        continue;
      }

      var h = line.match(/^(#{1,6})\s*(.+)$/);
      if (h) {
        var lvl = h[1].length;
        out.push("<h" + lvl + ">" + inline(h[2]) + "</h" + lvl + ">");
        i++; continue;
      }

      if (/^(\*|-|\+)\s+/.test(line)) {
        var items = [];
        while (i < lines.length && /^(\*|-|\+)\s+(.+)$/.test(lines[i])) {
          items.push(lines[i].replace(/^(\*|-|\+)\s+/, ""));
          i++;
        }
        flushList("ul", items);
        continue;
      }

      if (/^>\s*(.+)$/.test(line)) {
        var q = [];
        while (i < lines.length && /^>\s*(.+)$/.test(lines[i])) {
          q.push(lines[i].replace(/^>\s*/, ""));
          i++;
        }
        out.push("<blockquote>" + q.map(inline).join("<br />") + "</blockquote>");
        continue;
      }

      if (/^(\*{3,}|-{3,}|_{3,})$/.test(line.trim())) {
        out.push("<hr />");
        i++; continue;
      }

      var p = [line];
      i++;
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^([#>\-|*`]|\|\s*)/.test(lines[i])) {
        p.push(lines[i]);
        i++;
      }
      out.push("<p>" + p.map(inline).join(" ") + "</p>");
    }
    return out.join("\n");
  }

  /* ------------------------------------------------------------- state -- */
  var DATA = null;
  var filters = { semester: "all", topic: "all", status: "all", playable: "all" };
  var query = "";

  /* --------------------------------------------------------------- nav -- */
  var NAV = [
    { group: "Curriculum" },
    { id: "dashboard",   icon: "◈", label: "Dashboard" },
    { id: "map",         icon: "🗺️", label: "Wadi Valley Map" },
    { id: "lessons",     icon: "▤", label: "Lessons", count: function () { return DATA ? DATA.lessons.length : 98; } },
    { id: "pacing",      icon: "▦", label: "Pacing Calendar", count: function () { return DATA ? DATA.weeks.length : 38; } },
    { id: "experiences", icon: "✧", label: "Experiences & Twins" },

    { group: "Arcades & Sijill" },
    { id: "games",       icon: "🕹️", label: "Games & Arcades" },
    { id: "sijill",      icon: "❖", label: "The 16 Gates", count: function () { return Object.keys(sijill()).length; } },

    { group: "Classroom" },
    { id: "students",    icon: "☗", label: "Student Roster", count: function () { return hub.students.length; } },
    { id: "portfolios",  icon: "📜", label: "Stage 6 Portfolios" },
    { id: "tracking",    icon: "◎", label: "Caravan Tracking" },

    { group: "Reference" },
    { id: "library",     icon: "▣", label: "Research Atlas" }
  ];

  var TITLES = {
    dashboard: "Dashboard", map: "Wadi Valley Map Explorer", lessons: "Lessons Catalog",
    lesson: "Lesson Spec", pacing: "38-Week Pacing Calendar", experiences: "Experiences & Concrete Twins",
    games: "Interactive Mini-Games & Arcades", sijill: "The Sijill Gates", students: "Student Roster",
    portfolios: "Stage 6 Student Portfolios", tracking: "Caravan Collective Tracking",
    library: "Curriculum Atlas & Planning", doc: "Document Viewer"
  };

  function renderNav(active) {
    $("#nav").innerHTML = NAV.map(function (n) {
      if (n.group) return '<div class="nav-group">' + esc(n.group) + "</div>";
      var count = "";
      try { count = n.count ? '<span class="nav-count">' + n.count() + "</span>" : ""; } catch (e) {}
      return '<a class="nav-item' + (n.id === active ? " on" : "") + '" href="#/' + n.id + '">' +
        '<span class="nav-ico">' + n.icon + "</span>" + esc(n.label) + count + "</a>";
    }).join("");
  }

  function stat(label, value, note, accent) {
    return '<div class="stat" style="--accent:' + (accent || "var(--teal)") + '">' +
      '<div class="stat-label">' + esc(label) + "</div>" +
      '<div class="stat-value">' + esc(value) + "</div>" +
      (note ? '<div class="stat-note">' + esc(note) + "</div>" : "") +
      "</div>";
  }

  function meta(label, value, note, accent) {
    return '<div class="meta" style="--accent:' + (accent || "var(--teal)") + '">' +
      '<div class="meta-label">' + esc(label) + "</div>" +
      '<div class="meta-value">' + esc(value || "—") + "</div>" +
      (note ? '<div class="meta-note">' + esc(note) + "</div>" : "") +
      "</div>";
  }

  function lessonByCode(code) {
    if (!DATA || !DATA.lessons) return null;
    return DATA.lessons.find(function (l) { return l.code === code; }) || null;
  }

  /* ------------------------------------------------------------- views -- */
  var views = {};

  /* View: Dashboard */
  views.dashboard = function () {
    var seals = sijill();
    var sealed = Object.keys(seals).length;
    var playable = DATA.lessons.filter(function (l) { return l.deck; }).length;
    var boys = hub.students.length;
    var pebbles = hub.pebbles || sealed;

    var recent = Object.keys(seals).map(function (code) {
      return { code: code, date: seals[code].date || "" };
    }).sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); }).slice(0, 6);

    return '' +
      '<div class="hub-hero" style="background:linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%);border:1px solid var(--line);border-radius:var(--radius-lg);padding:28px 32px;display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;position:relative;overflow:hidden;">' +
        '<div style="max-width:620px;z-index:2;">' +
          '<div style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:var(--radius-pill);background:var(--teal-10);color:var(--teal);border:1px solid var(--teal-20);font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:12px;">' +
            '✦ Dar Al Fikr Schools · Grade 4 Mathematics' +
          '</div>' +
          '<h1 style="font-family:var(--font-display);font-size:26px;font-weight:700;color:var(--ink);line-height:1.2;margin-bottom:8px;">' +
            'The Valley of Trust · <span style="color:var(--teal);">Wadi al-Amanah</span>' +
          '</h1>' +
          '<p style="font-size:13.5px;color:var(--muted);line-height:1.6;margin-bottom:18px;">' +
            'Explore 98 vocational doors across 16 thematic gates. Master Grade 4 mathematics with concrete manipulatives, dual Stage 6 production pathways, and collective caravan progression.' +
          '</p>' +
          '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
            '<a href="#/map" class="btn btn-primary">🗺️ Open Interactive Map</a>' +
            '<a href="#/games" class="btn">🕹️ Launch Mini-Games</a>' +
            '<a href="#/portfolios" class="btn">📜 Stage 6 Studio</a>' +
          '</div>' +
        '</div>' +
        '<div style="text-align:center;flex-shrink:0;z-index:2;">' +
          '<div class="pebble-vessel">' +
            '<div class="pebble-fill" style="height:' + Math.min(100, Math.round((pebbles / 91) * 100)) + '%;"></div>' +
            '<div class="pebble-val">' + pebbles + '</div>' +
            '<span style="font-size:10px;text-transform:uppercase;color:#fff;letter-spacing:0.08em;z-index:2;">Pebbles</span>' +
          '</div>' +
          '<div style="font-size:11.5px;color:var(--muted);margin-top:8px;">Caravan Collective Progress</div>' +
        '</div>' +
      '</div>' +

      '<div class="grid g-4" style="margin-bottom:20px">' +
        stat("Total Lessons", DATA.lessons.length, "16 Gates · 2 Semesters", "var(--teal)") +
        stat("Doors Sealed", sealed + " / 91", pct(sealed, 91) + "% valley hydrated", "var(--pass)") +
        stat("Playable Decks", playable, "Offline standalone HTML", "var(--s4)") +
        stat("Students Enrolled", boys, Object.keys(hub.records).length + " Dojo observations", "var(--gold)") +
      '</div>' +

      '<div class="grid g-2" style="margin-bottom:20px">' +
        '<div class="card">' +
          '<div class="card-head">' +
            '<h2 class="card-title">16 Gates of Wadi al-Amanah</h2>' +
            '<a class="btn btn-sm" href="#/sijill">View All</a>' +
          '</div>' +
          '<div>' +
            DATA.gates.slice(0, 8).map(function (g) {
              var done = Object.keys(seals).filter(function (c) { return parseInt(c.split("-")[0], 10) === g.topic; }).length;
              var p = pct(done, g.doors);
              return '<div class="sijill-row' + (done >= g.doors && g.doors > 0 ? " done" : "") + '">' +
                '<div><strong>Gate ' + g.topic + ' · ' + esc(g.name) + '</strong><br /><small style="color:var(--muted)">' + esc(g.lead || g.title) + '</small></div>' +
                '<div style="display:flex;align-items:center;gap:10px;">' +
                  '<span style="font-size:11.5px;font-weight:600;color:var(--muted)">' + done + '/' + g.doors + '</span>' +
                  '<div class="gate-progress-track"><div class="gate-progress-fill" style="width:' + p + '%;background:' + (g.color || "var(--teal)") + '"></div></div>' +
                '</div>' +
              '</div>';
            }).join("") +
          '</div>' +
        '</div>' +

        '<div class="card">' +
          '<div class="card-head">' +
            '<h2 class="card-title">Recently Sealed Doors & Quick Tools</h2>' +
            '<a class="btn btn-sm" href="#/lessons">Catalog</a>' +
          '</div>' +
          (recent.length === 0 ? '<p style="color:var(--muted);font-size:13px;">No doors sealed yet. Open a lesson or use the Interactive Map to seal a door.</p>' :
            recent.map(function (r) {
              var l = lessonByCode(r.code);
              return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surface-inset);border-radius:var(--radius-sm);margin-bottom:8px;">' +
                '<div><strong class="door-code">' + esc(r.code) + '</strong> ' + esc(l ? l.title : "") + '</div>' +
                '<div style="font-size:11.5px;color:var(--pass);font-weight:600;">✓ Sealed ' + esc(r.date) + '</div>' +
              '</div>';
            }).join("")
          ) +
          '<div style="margin-top:auto;padding-top:14px;border-top:1px solid var(--line);display:flex;gap:10px;flex-wrap:wrap;">' +
            '<a href="../slides/EXPERIENCES.html" target="_blank" class="btn btn-sm">📜 Activity Atlas Deck</a>' +
            '<a href="../slides/PRODUCTION.html" target="_blank" class="btn btn-sm">🖨️ Stage 6 Print Studio</a>' +
            '<a href="../slides/door-6-2.html" target="_blank" class="btn btn-sm">📽️ Door 6-2 Slide Deck</a>' +
          '</div>' +
        '</div>' +
      '</div>';
  };

  /* View: Interactive Wadi Map */
  views.map = function () {
    var seals = sijill();
    var sealedCount = Object.keys(seals).length;
    var waterPct = Math.min(100, Math.round((sealedCount / 91) * 100));

    return '' +
      '<div class="page-head" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">' +
        '<div>' +
          '<h1 class="page-title">The Interactive Map of Wadi al-Amanah</h1>' +
          '<p class="page-sub">Dar Al Fikr Boys School · Grade 4 · River Hydration: <strong>' + waterPct + '%</strong> (' + sealedCount + '/91 Doors Sealed)</p>' +
        '</div>' +
        '<div style="display:flex;gap:8px;">' +
          '<button id="btn-caravan-walk" class="btn btn-primary">🐪 March Caravan</button>' +
          '<a href="../slides/wadi-map.html" target="_blank" class="btn">⤢ Fullscreen Map Deck</a>' +
        '</div>' +
      '</div>' +

      '<div class="map-explorer-container" style="display:grid;grid-template-columns:1fr 340px;gap:0;border:1px solid var(--line);border-radius:var(--radius-lg);overflow:hidden;background:var(--surface);">' +
        '<div class="map-svg-wrap" style="background:radial-gradient(circle at 50% 50%, #08242c 0%, #041014 100%);position:relative;padding:20px;display:flex;align-items:center;justify-content:center;">' +
          '<svg id="live-wadi-svg" viewBox="0 0 1000 650" style="width:100%;height:auto;max-height:600px;">' +
            '<defs>' +
              '<linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">' +
                '<stop offset="0%" stop-color="#00bed6" />' +
                '<stop offset="100%" stop-color="#38effa" />' +
              '</linearGradient>' +
              '<filter id="glow" x="-20%" y="-20%" width="140%" height="140%">' +
                '<feGaussianBlur stdDeviation="4" result="blur" />' +
                '<feComposite in="SourceGraphic" in2="blur" operator="over" />' +
              '</filter>' +
            '</defs>' +
            '<!-- Desert terrain contours -->' +
            '<path d="M 50 120 Q 250 80 450 140 T 850 110 T 950 200" fill="none" stroke="#103640" stroke-width="60" opacity="0.3" />' +
            '<path d="M 80 500 Q 300 580 550 490 T 920 540" fill="none" stroke="#103640" stroke-width="80" opacity="0.3" />' +
            '<!-- Serpentine River Bed -->' +
            '<path id="wadi-river-bed" d="M 60 180 C 200 120, 250 320, 400 240 C 550 160, 600 380, 750 300 C 850 240, 900 480, 850 560" fill="none" stroke="#0a2a33" stroke-width="16" stroke-linecap="round" />' +
            '<!-- Flowing Turquoise Water Canal -->' +
            '<path id="wadi-water-flow" d="M 60 180 C 200 120, 250 320, 400 240 C 550 160, 600 380, 750 300 C 850 240, 900 480, 850 560" fill="none" stroke="url(#riverGrad)" stroke-width="10" stroke-linecap="round" filter="url(#glow)" stroke-dasharray="1400" stroke-dashoffset="' + (1400 - (1400 * waterPct / 100)) + '" style="transition:stroke-dashoffset 1s ease;" />' +
            '<!-- 16 Gate Waypoints -->' +
            DATA.gates.map(function (g, idx) {
              var pts = [
                {x: 60, y: 180}, {x: 120, y: 160}, {x: 180, y: 140}, {x: 230, y: 220},
                {x: 290, y: 290}, {x: 350, y: 270}, {x: 410, y: 230}, {x: 480, y: 190},
                {x: 540, y: 220}, {x: 590, y: 310}, {x: 650, y: 350}, {x: 710, y: 320},
                {x: 770, y: 280}, {x: 830, y: 320}, {x: 880, y: 440}, {x: 850, y: 560}
              ];
              var p = pts[idx] || {x: 100 + idx * 50, y: 200};
              var done = Object.keys(seals).filter(function (c) { return parseInt(c.split("-")[0], 10) === g.topic; }).length;
              var isDone = done >= g.doors && g.doors > 0;
              return '<g class="gate-marker" data-gate="' + g.topic + '" style="cursor:pointer;" transform="translate(' + p.x + ',' + p.y + ')">' +
                '<circle r="22" fill="' + (isDone ? "var(--pass)" : (g.color || "var(--teal)")) + '" opacity="0.25" />' +
                '<circle r="14" fill="#091a20" stroke="' + (isDone ? "var(--pass)" : (g.color || "var(--teal)")) + '" stroke-width="2.5" />' +
                '<text text-anchor="middle" dy="4" fill="#ffffff" font-size="10" font-weight="700">' + g.topic + '</text>' +
                '<text text-anchor="middle" dy="32" fill="#a4d5dc" font-size="11" font-weight="600" style="paint-order:stroke;stroke:#050f13;stroke-width:3px;">' + esc(g.name) + '</text>' +
              '</g>';
            }).join("") +
            '<!-- Caravan Icon Marker -->' +
            '<g id="caravan-marker" transform="translate(60, 180)">' +
              '<circle r="18" fill="var(--gold)" opacity="0.35" />' +
              '<circle r="10" fill="var(--gold)" />' +
              '<text text-anchor="middle" dy="4" font-size="12">🐪</text>' +
            '</g>' +
          '</svg>' +
        '</div>' +

        '<div id="gate-dossier-panel" style="padding:22px;background:var(--surface);border-left:1px solid var(--line);display:flex;flex-direction:column;gap:14px;overflow-y:auto;max-height:600px;">' +
          '<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--teal);letter-spacing:0.08em;">✦ Gate Dossier</div>' +
          '<h3 id="dossier-name" style="font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--ink);">Select a Gate</h3>' +
          '<p id="dossier-lead" style="font-size:12.5px;color:var(--muted);">Click any numbered waypoint on the map to inspect its vocational guild, concrete twin, and door seals.</p>' +
          '<div id="dossier-content" style="display:flex;flex-direction:column;gap:10px;"></div>' +
        '</div>' +
      '</div>';
  };

  /* View: Lessons Catalog */
  views.lessons = function () {
    var seals = sijill();
    var list = DATA.lessons.filter(function (l) {
      if (filters.semester !== "all" && String(l.semester) !== filters.semester) return false;
      if (filters.topic !== "all" && String(l.topic) !== filters.topic) return false;
      if (filters.playable === "yes" && !l.deck) return false;
      if (filters.status === "sealed" && (!seals[l.code] || !seals[l.code].done)) return false;
      if (filters.status === "open" && seals[l.code] && seals[l.code].done) return false;
      if (query) {
        var q = query.toLowerCase();
        return l.code.toLowerCase().includes(q) || l.title.toLowerCase().includes(q) || (l.objective || "").toLowerCase().includes(q);
      }
      return true;
    });

    return '' +
      '<div class="page-head">' +
        '<h1 class="page-title">Grade 4 Mathematics · Lessons Catalog</h1>' +
        '<p class="page-sub">98 lesson files · enVision 2024 · All doors mapped to vocational roles and concrete manipulatives.</p>' +
      '</div>' +

      '<div class="filter-bar">' +
        '<div class="filter-group">' +
          '<span style="font-size:11.5px;font-weight:600;color:var(--muted)">Semester:</span>' +
          '<button class="filter-btn' + (filters.semester === "all" ? " on" : "") + '" data-f="semester" data-v="all">All</button>' +
          '<button class="filter-btn' + (filters.semester === "1" ? " on" : "") + '" data-f="semester" data-v="1">Sem 1</button>' +
          '<button class="filter-btn' + (filters.semester === "2" ? " on" : "") + '" data-f="semester" data-v="2">Sem 2</button>' +
        '</div>' +
        '<div class="filter-group">' +
          '<span style="font-size:11.5px;font-weight:600;color:var(--muted)">Status:</span>' +
          '<button class="filter-btn' + (filters.status === "all" ? " on" : "") + '" data-f="status" data-v="all">All</button>' +
          '<button class="filter-btn' + (filters.status === "sealed" ? " on" : "") + '" data-f="status" data-v="sealed">✓ Sealed</button>' +
          '<button class="filter-btn' + (filters.status === "open" ? " on" : "") + '" data-f="status" data-v="open">Pending</button>' +
        '</div>' +
        '<div class="filter-group" style="margin-left:auto;">' +
          '<select class="filter-select" data-f="topic">' +
            '<option value="all">All 16 Topics / Gates</option>' +
            DATA.gates.map(function (g) {
              return '<option value="' + g.topic + '"' + (filters.topic === String(g.topic) ? " selected" : "") + '>Topic ' + g.topic + ': ' + esc(g.name) + '</option>';
            }).join("") +
          '</select>' +
        '</div>' +
      '</div>' +

      '<div class="grid g-3">' +
        list.map(function (l) {
          var isDone = seals[l.code] && seals[l.code].done;
          return '<div class="lesson-card' + (isDone ? " sealed" : "") + '">' +
            '<div class="lesson-head">' +
              '<span class="door-code">' + esc(l.code) + '</span>' +
              '<span style="font-size:11px;color:var(--muted);font-weight:600;">Sem ' + l.semester + ' · Topic ' + l.topic + '</span>' +
            '</div>' +
            '<div class="lesson-title">' + esc(l.title) + '</div>' +
            '<div class="lesson-role"><strong>' + esc(l.place || "Wadi Gate") + '</strong> · ' + esc(l.rifqah || "al-Misbah") + '</div>' +
            '<p style="font-size:12px;color:var(--muted);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' +
              esc(l.objective) +
            '</p>' +
            '<div class="lesson-actions">' +
              '<a href="#/lesson/' + l.code + '" class="btn btn-sm">Inspect Spec</a>' +
              '<button class="btn btn-sm btn-seal-toggle" data-door="' + l.code + '" style="color:' + (isDone ? "var(--pass)" : "var(--muted)") + ';">' +
                (isDone ? "✓ Sealed" : "Mark Sealed") +
              '</button>' +
            '</div>' +
          '</div>';
        }).join("") +
      '</div>';
  };

  /* View: Single Lesson */
  views.lesson = function (code) {
    var l = lessonByCode(code);
    if (!l) return '<div class="card"><p>Lesson ' + esc(code) + ' not found.</p></div>';
    var seals = sijill();
    var isDone = seals[l.code] && seals[l.code].done;

    return '' +
      '<div class="page-head" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:gap;gap:12px;">' +
        '<div>' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">' +
            '<span class="door-code" style="font-size:14px;">Door ' + esc(l.code) + '</span>' +
            '<span style="font-size:12px;color:var(--muted);font-weight:600;">Semester ' + l.semester + ' · Topic ' + l.topic + ': ' + esc(l.topicTitle) + '</span>' +
          '</div>' +
          '<h1 class="page-title">' + esc(l.title) + '</h1>' +
        '</div>' +
        '<div style="display:flex;gap:10px;">' +
          '<button class="btn btn-seal-toggle" data-door="' + l.code + '">' +
            (isDone ? "✓ Sealed in Sijill" : "✦ Mark Door Sealed") +
          '</button>' +
          (l.deck ? '<a href="' + l.deck + '" target="_blank" class="btn btn-primary">📽️ Launch Slide Deck</a>' : "") +
        '</div>' +
      '</div>' +

      '<div class="grid g-4" style="margin-bottom:20px;">' +
        meta("Objective (I Can)", l.objective, "Stage 0 target", "var(--teal)") +
        meta("Vocational Setting", l.place || "Valley Gate", l.setting || "Caravan guild", "var(--s3)") +
        meta("Rifqah / Guide", l.rifqah || "al-Misbah", "Guild Leader", "var(--gold)") +
        meta("Week Pacing", l.week ? "Week " + l.week : "Standard", "Academic calendar", "var(--s4)") +
      '</div>' +

      '<div class="grid g-2" style="margin-bottom:20px;">' +
        '<div class="card">' +
          '<div class="card-head"><h3 class="card-title">Stage 2 · Concrete Hands-on Twin</h3></div>' +
          '<p style="font-size:13px;color:var(--ink-2);line-height:1.5;">' + esc(l.twin || "Physical manipulative twin running first in CRA sequence.") + '</p>' +
          '<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line);">' +
            '<h4 style="font-size:11.5px;font-weight:700;text-transform:uppercase;color:var(--teal-deep);margin-bottom:4px;">Solve & Share Hook</h4>' +
            '<p style="font-size:12.5px;color:var(--muted);font-style:italic;">' + esc(l.hook) + '</p>' +
          '</div>' +
        '</div>' +

        '<div class="card">' +
          '<div class="card-head"><h3 class="card-title">Stage 6 · Dual Production Pathways</h3></div>' +
          '<div style="margin-bottom:10px;">' +
            '<strong style="font-size:12px;color:var(--teal-deep);">Pathway A (Job Artifact):</strong>' +
            '<p style="font-size:13px;color:var(--ink-2);">' + esc(l.production ? l.production.A : "Master Sijill Record") + '</p>' +
          '</div>' +
          '<div>' +
            '<strong style="font-size:12px;color:var(--gold-ink);">Pathway B (Creative Transfer):</strong>' +
            '<p style="font-size:13px;color:var(--ink-2);">' + esc(l.production ? l.production.B : "Creative Desert Commission") + '</p>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="card">' +
        '<div class="card-head"><h3 class="card-title">Full Lesson Markdown Body</h3></div>' +
        '<div id="lesson-body" style="font-size:13.5px;line-height:1.6;">Loading lesson specification…</div>' +
      '</div>';
  };

  /* View: Pacing Calendar */
  views.pacing = function () {
    var seals = sijill();
    return '' +
      '<div class="page-head">' +
        '<h1 class="page-title">38-Week Academic Pacing Calendar</h1>' +
        '<p class="page-sub">Dar Al Fikr Grade 4 Mathematics · 2026–2027 · 19 Weeks per Semester</p>' +
      '</div>' +

      '<div class="table-wrap">' +
        '<table>' +
          '<thead>' +
            '<tr><th>Sem</th><th>Week</th><th>Focus & Scope</th><th>Door Codes</th><th>Status</th></tr>' +
          '</thead>' +
          '<tbody>' +
            DATA.weeks.map(function (w) {
              var done = w.codes.filter(function (c) { return seals[c] && seals[c].done; }).length;
              var total = w.codes.length;
              var pStr = total > 0 ? done + " / " + total + " sealed" : "—";
              return '<tr>' +
                '<td>Sem ' + w.semester + '</td>' +
                '<td><strong>Week ' + w.week + '</strong></td>' +
                '<td>' + esc(w.focus) + '</td>' +
                '<td>' + (w.codes.map(function (c) { return '<a href="#/lesson/' + c + '" class="door-code" style="margin-right:4px;">' + c + '</a>'; }).join("") || "—") + '</td>' +
                '<td><span style="font-size:11.5px;font-weight:600;color:' + (done === total && total > 0 ? "var(--pass)" : "var(--muted)") + ';">' + pStr + '</span></td>' +
              '</tr>';
            }).join("") +
          '</tbody>' +
        '</table>' +
      '</div>';
  };

  /* View: Experiences & Manipulatives */
  views.experiences = function () {
    return '' +
      '<div class="page-head">' +
        '<h1 class="page-title">Experiences & Boarding-Pass Artifacts</h1>' +
        '<p class="page-sub">The Boarding-Pass Law: Every door has a distinct job role, tactile manipulative twin, and authentic artifact.</p>' +
      '</div>' +

      '<div class="grid g-2">' +
        DATA.lessons.map(function (l) {
          return '<div class="card">' +
            '<div class="card-head">' +
              '<div><span class="door-code">' + esc(l.code) + '</span> <strong style="font-size:14px;margin-left:6px;">' + esc(l.place || "Valley Gate") + '</strong></div>' +
              '<span style="font-size:11px;color:var(--muted)">' + esc(l.rifqah || "al-Misbah") + '</span>' +
            '</div>' +
            '<h4 style="font-family:var(--font-display);font-size:14px;color:var(--ink);margin-bottom:8px;">' + esc(l.title) + '</h4>' +
            '<div style="background:var(--surface-inset);padding:10px 12px;border-radius:var(--radius-sm);margin-bottom:10px;">' +
              '<strong style="font-size:11px;text-transform:uppercase;color:var(--teal-deep);display:block;margin-bottom:2px;">Concrete Twin (CRA Step 1):</strong>' +
              '<span style="font-size:12.5px;color:var(--ink-2);">' + esc(l.twin || "Tactile manipulative kit") + '</span>' +
            '</div>' +
            '<div style="font-size:12.5px;color:var(--muted);">' +
              '<strong>Signed Artifact:</strong> ' + esc(l.production ? l.production.A : "Sijill Entry") +
            '</div>' +
          '</div>';
        }).join("") +
      '</div>';
  };

  /* View: Interactive Mini-Games */
  views.games = function () {
    return '' +
      '<div class="page-head">' +
        '<h1 class="page-title">Interactive Mini-Games & FIKR Math Arcades</h1>' +
        '<p class="page-sub">Zero-dependency, offline arithmetic drills, place-value balancers, and AI Critic reasoning simulators.</p>' +
      '</div>' +

      '<div class="game-card-grid">' +
        '<div class="game-tile">' +
          '<div class="game-tile-icon">🏮</div>' +
          '<h3 style="font-family:var(--font-display);font-size:16px;color:var(--ink);">Lantern Drill ×2–×12 (Sitr Trainer)</h3>' +
          '<p style="font-size:12.5px;color:var(--muted);">Rapid-fire multiplication practice with Sitr privacy mode. Earn golden pebbles for the class collective bowl.</p>' +
          '<button id="btn-start-lantern" class="btn btn-primary" style="margin-top:auto;">Play Lantern Drill</button>' +
        '</div>' +

        '<div class="game-tile">' +
          '<div class="game-tile-icon">🐝</div>' +
          '<h3 style="font-family:var(--font-display);font-size:16px;color:var(--ink);">Period Hive Base-10 Game</h3>' +
          '<p style="font-size:12.5px;color:var(--muted);">Balance caravan cargo by grouping Millions, Thousands, and Units into standard and expanded forms.</p>' +
          '<a href="../slides/period-hive.html" target="_blank" class="btn" style="margin-top:auto;">Launch Period Hive Deck</a>' +
        '</div>' +

        '<div class="game-tile">' +
          '<div class="game-tile-icon">⚖️</div>' +
          '<h3 style="font-family:var(--font-display);font-size:16px;color:var(--ink);">Misbah Stage 4 AI Critic Challenge</h3>' +
          '<p style="font-size:12.5px;color:var(--muted);">Identify mathematical calculation errors before caravan departure. Diagnose the exact algebraic flaw.</p>' +
          '<button id="btn-start-critic" class="btn" style="margin-top:auto;">Launch Critic Arena</button>' +
        '</div>' +

        '<div class="game-tile">' +
          '<div class="game-tile-icon">🪙</div>' +
          '<h3 style="font-family:var(--font-display);font-size:16px;color:var(--ink);">Dakkan al-Halalah Cashier</h3>' +
          '<p style="font-size:12.5px;color:var(--muted);">Mental math trade simulator. Calculate change in Saudi Riyals (SAR) and Halalahs at the market stall.</p>' +
          '<button id="btn-start-souq" class="btn" style="margin-top:auto;">Open Souq Register</button>' +
        '</div>' +
      '</div>' +

      '<!-- Interactive Arena Container -->' +
      '<div id="interactive-game-arena" class="game-arena-box" style="display:none;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:16px;">' +
          '<h3 id="arena-game-title" style="font-family:var(--font-display);font-size:17px;color:var(--teal);">Game Arena</h3>' +
          '<button id="arena-close-btn" class="btn btn-sm">✕ Close Arena</button>' +
        '</div>' +
        '<div id="arena-body-mount"></div>' +
      '</div>';
  };

  /* View: Sijill 16 Gates */
  views.sijill = function () {
    var seals = sijill();
    return '' +
      '<div class="page-head">' +
        '<h1 class="page-title">The Sijill · 16 Gates of Wadi al-Amanah</h1>' +
        '<p class="page-sub">The official school ledger recording sealed doors and vocational commissions across the entire academic year.</p>' +
      '</div>' +

      '<div class="grid g-2">' +
        DATA.gates.map(function (g) {
          var gateDoors = DATA.lessons.filter(function (l) { return l.topic === g.topic; });
          var done = gateDoors.filter(function (l) { return seals[l.code] && seals[l.code].done; }).length;
          var isComplete = done >= gateDoors.length && gateDoors.length > 0;
          return '<div class="card' + (isComplete ? ' style="border-color:var(--pass);"' : '') + '">' +
            '<div class="card-head">' +
              '<div style="display:flex;align-items:center;gap:10px;">' +
                '<span style="font-size:24px;">' + (g.badge || "🏮") + '</span>' +
                '<div>' +
                  '<strong style="font-size:15px;color:var(--ink);">Gate ' + g.topic + ' · ' + esc(g.name) + '</strong>' +
                  '<div style="font-size:11.5px;color:var(--muted);">' + esc(g.lead) + ' · ' + esc(g.guild) + '</div>' +
                '</div>' +
              '</div>' +
              '<span style="font-size:12px;font-weight:700;color:' + (isComplete ? "var(--pass)" : "var(--teal)") + ';">' + done + '/' + gateDoors.length + ' Sealed</span>' +
            '</div>' +
            '<p style="font-size:12.5px;color:var(--ink-2);margin-bottom:12px;"><strong>Commission:</strong> ' + esc(g.commission) + '</p>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
              gateDoors.map(function (d) {
                var dSealed = seals[d.code] && seals[d.code].done;
                return '<a href="#/lesson/' + d.code + '" class="door-code" style="text-decoration:none;background:' + (dSealed ? "var(--pass-soft)" : "var(--teal-10)") + ';color:' + (dSealed ? "var(--pass-ink)" : "var(--teal)") + ';border-color:' + (dSealed ? "var(--pass)" : "var(--teal-20)") + ';">' +
                  (dSealed ? "✓ " : "") + d.code +
                '</a>';
              }).join("") +
            '</div>' +
          '</div>';
        }).join("") +
      '</div>';
  };

  /* View: Student Roster */
  views.students = function () {
    return '' +
      '<div class="page-head" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">' +
        '<div>' +
          '<h1 class="page-title">Grade 4 Student Roster</h1>' +
          '<p class="page-sub">Manage student accounts, sections, and private Dojo P observations.</p>' +
        '</div>' +
        '<div style="display:flex;gap:8px;">' +
          '<button id="s-export" class="btn">Export CSV</button>' +
        '</div>' +
      '</div>' +

      '<div class="grid g-2" style="margin-bottom:20px;">' +
        '<div class="card">' +
          '<div class="card-head"><h3 class="card-title">Add Single Student</h3></div>' +
          '<div style="display:flex;gap:10px;margin-bottom:10px;">' +
            '<input id="s-name" type="text" placeholder="Student Name (e.g. Zayd Khalid)" class="filter-select" style="flex:2;" />' +
            '<input id="s-class" type="text" placeholder="Section (e.g. 4A)" class="filter-select" style="flex:1;" />' +
          '</div>' +
          '<button id="s-add" class="btn btn-primary btn-sm">Add Student</button>' +
        '</div>' +

        '<div class="card">' +
          '<div class="card-head"><h3 class="card-title">Bulk Import</h3></div>' +
          '<textarea id="s-bulk" placeholder="Paste names, one per line…" rows="2" class="filter-select" style="width:100%;margin-bottom:10px;"></textarea>' +
          '<div style="display:flex;gap:10px;">' +
            '<input id="s-bulk-class" type="text" placeholder="Section for all" class="filter-select" style="flex:1;" />' +
            '<button id="s-import" class="btn btn-sm">Import List</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="table-wrap">' +
        '<table>' +
          '<thead><tr><th>ID</th><th>Student Name</th><th>Section</th><th>Portfolio</th><th>Actions</th></tr></thead>' +
          '<tbody>' +
            (hub.students.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:var(--muted)">No students registered yet. Add students above.</td></tr>' :
              hub.students.map(function (s) {
                return '<tr>' +
                  '<td><code>' + esc(s.id) + '</code></td>' +
                  '<td><strong>' + esc(s.name) + '</strong></td>' +
                  '<td>' + esc(s.klass || "—") + '</td>' +
                  '<td><a href="#/portfolios/' + s.id + '" class="btn btn-sm">View Portfolio</a></td>' +
                  '<td><button class="btn btn-sm btn-del-student" data-id="' + s.id + '" style="color:var(--danger)">Remove</button></td>' +
                '</tr>';
              }).join("")
            ) +
          '</tbody>' +
        '</table>' +
      '</div>';
  };

  /* View: Student Portfolios & Stage 6 Studio */
  views.portfolios = function (studentId) {
    var student = hub.students.find(function (s) { return s.id === studentId; }) || (hub.students[0] || { id: "s1", name: "Zayd ibn Khalid", klass: "Grade 4A" });
    
    return '' +
      '<div class="page-head" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">' +
        '<div>' +
          '<h1 class="page-title">Stage 6 Student Portfolios & Sijill Sheets</h1>' +
          '<p class="page-sub">Dual Production Pathway A (Real Vocational Artifact) and Pathway B (Creative Transfer Challenge).</p>' +
        '</div>' +
        '<div style="display:flex;gap:10px;">' +
          '<button onclick="window.print()" class="btn btn-primary">🖨️ Print / Save A5 Sheet</button>' +
          '<select id="portfolio-student-select" class="filter-select">' +
            hub.students.map(function (s) {
              return '<option value="' + s.id + '"' + (s.id === student.id ? " selected" : "") + '>' + esc(s.name) + ' (' + esc(s.klass || "4A") + ')</option>';
            }).join("") +
          '</select>' +
        '</div>' +
      '</div>' +

      '<div class="parchment-sheet">' +
        '<div class="parchment-header">' +
          '<div style="display:flex;align-items:center;gap:14px;">' +
            '<img src="assets/daf-logo.png" alt="Dar Al Fikr" class="parchment-logo" />' +
            '<div>' +
              '<h2 style="font-family:var(--font-serif);font-size:20px;font-weight:700;color:#0b2e35;margin:0;">DAR AL FIKR SCHOOLS</h2>' +
              '<span style="font-size:11px;color:#6b5a32;letter-spacing:0.04em;">Valley of Trust · Sijill Master Artifact Record</span>' +
            '</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<strong style="font-size:13px;color:#0b2e35;">Academic Year 2026–2027</strong><br />' +
            '<span style="font-size:11.5px;color:#6b5a32;">enVision Grade 4 Mathematics</span>' +
          '</div>' +
        '</div>' +

        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:20px;">' +
          '<div style="background:rgba(255,255,255,0.7);padding:10px 12px;border-radius:6px;border:1px solid rgba(212,175,55,0.3);">' +
            '<span style="font-size:10px;text-transform:uppercase;color:#7a6639;font-weight:700;display:block;">Student Scholar</span>' +
            '<strong style="font-size:14px;color:#12282d;">' + esc(student.name) + '</strong>' +
          '</div>' +
          '<div style="background:rgba(255,255,255,0.7);padding:10px 12px;border-radius:6px;border:1px solid rgba(212,175,55,0.3);">' +
            '<span style="font-size:10px;text-transform:uppercase;color:#7a6639;font-weight:700;display:block;">Section / Gate</span>' +
            '<strong style="font-size:14px;color:#12282d;">' + esc(student.klass || "4A") + ' · Gate 6 (Market Souq)</strong>' +
          '</div>' +
          '<div style="background:rgba(255,255,255,0.7);padding:10px 12px;border-radius:6px;border:1px solid rgba(212,175,55,0.3);">' +
            '<span style="font-size:10px;text-transform:uppercase;color:#7a6639;font-weight:700;display:block;">Production Pathway</span>' +
            '<strong style="font-size:14px;color:#12282d;">Pathway A · Vocational Manifest</strong>' +
          '</div>' +
        '</div>' +

        '<div style="background:#fff;border:1px dashed rgba(212,175,55,0.6);border-radius:8px;padding:18px;margin-bottom:20px;min-height:140px;">' +
          '<span style="font-size:11px;font-weight:700;color:#0e8f94;text-transform:uppercase;display:block;margin-bottom:8px;">Mathematical Reasoning & Concrete Data Proof:</span>' +
          '<p style="font-size:13.5px;line-height:1.6;color:#1e2d30;">' +
            'Stall Inventory Balance: 24 cartons of dates weighed with brass scales. Total weight = 24 × 35 kg = 840 kg. Net trade exchange settled at 4,200 SAR with 0 remainder. Verified by strip diagram and area model partial products.' +
          '</p>' +
        '</div>' +

        '<table style="margin-bottom:20px;font-size:12px;border:1px solid rgba(212,175,55,0.4);">' +
          '<thead><tr style="background:rgba(212,175,55,0.15);"><th>Criterion</th><th>Mastery (3)</th><th>Proficient (2)</th><th>Developing (1)</th></tr></thead>' +
          '<tbody>' +
            '<tr><td><strong>1. CRA Manipulative Evidence</strong></td><td>Concrete twin executed with precision</td><td>Representational model clear</td><td>Concrete step incomplete</td></tr>' +
            '<tr><td><strong>2. Mathematical Accuracy</strong></td><td>All equations and standard algorithms sound</td><td>Minor arithmetic slip; method sound</td><td>Algorithmic misconception</td></tr>' +
            '<tr><td><strong>3. Virtue & Amanah</strong></td><td>Signed and verified independently</td><td>Assisted verification</td><td>Unverified calculations</td></tr>' +
          '</tbody>' +
        '</table>' +

        '<div class="parchment-stamp">' +
          '<span>DAR AL FIKR</span>' +
          '<strong>SEALED</strong>' +
          '<span>MASTER</span>' +
        '</div>' +
      '</div>';
  };

  /* View: Caravan Collective Tracking */
  views.tracking = function () {
    var seals = sijill();
    var sealedCount = Object.keys(seals).length;
    var pebbles = hub.pebbles || sealedCount;

    return '' +
      '<div class="page-head">' +
        '<h1 class="page-title">Caravan Collective Tracking & Sitr Mastery</h1>' +
        '<p class="page-sub">Cooperative class progression: No public rankings. Collective pebbles fill the communal bowl as doors are sealed.</p>' +
      '</div>' +

      '<div class="grid g-2" style="margin-bottom:24px;">' +
        '<div class="card" style="text-align:center;display:flex;flex-direction:column;align-items:center;">' +
          '<div class="card-head" style="width:100%;"><h3 class="card-title">Class Caravan Pebble Bowl</h3></div>' +
          '<div class="pebble-vessel" style="margin:16px 0;">' +
            '<div class="pebble-fill" style="height:' + Math.min(100, Math.round((pebbles / 91) * 100)) + '%;"></div>' +
            '<div class="pebble-val">' + pebbles + '</div>' +
            '<span style="font-size:11px;text-transform:uppercase;color:#fff;letter-spacing:0.08em;z-index:2;">Pebbles</span>' +
          '</div>' +
          '<p style="font-size:13px;color:var(--muted);max-width:400px;line-height:1.5;">' +
            'Every completed door and private Sitr drill adds a pebble to the caravan vessel. Next collective milestone: <strong>Oasis Rest at ' + (Math.ceil(pebbles / 15) * 15 || 15) + ' pebbles</strong>.' +
          '</p>' +
        '</div>' +

        '<div class="card">' +
          '<div class="card-head"><h3 class="card-title">Sitr Private Mastery Domains</h3></div>' +
          '<div style="display:flex;flex-direction:column;gap:12px;">' +
            [
              { domain: "Place Value & Millions", val: 92 },
              { domain: "Multi-digit Operations (+\u2212)", val: 88 },
              { domain: "Multiplication by 1 & 2-Digits", val: 84 },
              { domain: "Division & Remainders", val: 78 },
              { domain: "Fraction Equivalence & Operations", val: 75 },
              { domain: "Decimals & SAR Currency", val: 80 }
            ].map(function (d) {
              return '<div>' +
                '<div style="display:flex;justify-content:space-between;font-size:12.5px;font-weight:600;margin-bottom:4px;">' +
                  '<span>' + d.domain + '</span>' +
                  '<span style="color:var(--teal);">' + d.val + '%</span>' +
                '</div>' +
                '<div class="gate-progress-track" style="width:100%;height:8px;">' +
                  '<div class="gate-progress-fill" style="width:' + d.val + '%;"></div>' +
                '</div>' +
              '</div>';
            }).join("") +
          '</div>' +
        '</div>' +
      '</div>';
  };

  /* View: Library & Atlas */
  views.library = function () {
    return '' +
      '<div class="page-head">' +
        '<h1 class="page-title">Curriculum Planning & Research Atlas</h1>' +
        '<p class="page-sub">Foundational pedagogy, CRA sequencing research, and the 91-door activity playbook.</p>' +
      '</div>' +

      '<div class="grid g-3">' +
        DATA.extras.map(function (e) {
          return '<div class="card">' +
            '<div class="card-head">' +
              '<h3 class="card-title">' + esc(e.name) + '</h3>' +
              '<span style="font-size:18px;">' + (e.icon || "📖") + '</span>' +
            '</div>' +
            '<p style="font-size:13px;color:var(--muted);margin-bottom:14px;">' + esc(e.note) + '</p>' +
            '<a href="' + e.file + '" target="_blank" class="btn btn-sm btn-primary" style="margin-top:auto;">Open App / File</a>' +
          '</div>';
        }).join("") +
      '</div>';
  };

  /* ----------------------------------------------------------- router -- */
  function parseHash() {
    var h = (location.hash || "#/dashboard").slice(2);
    var parts = h.split("/");
    return { name: parts[0] || "dashboard", arg: parts[1] || null };
  }

  function render() {
    var route = parseHash();
    var viewFn = views[route.name] || views.dashboard;

    renderNav(route.name);
    $("#crumb").innerHTML = 'Grade 4 Mathematics · <strong>' + esc(TITLES[route.name] || route.name) + '</strong>';
    $("#view").innerHTML = viewFn(route.arg);
    window.scrollTo(0, 0);
    document.getElementById("app").classList.remove("nav-open");

    if (route.name === "lesson") loadMarkdown(lessonByCode(route.arg), "#lesson-body");
    wireEvents(route);
  }

  function loadMarkdown(l, target) {
    if (!l) return;
    fetch(l.path).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    }).then(function (text) {
      var box = $(target);
      if (box) box.innerHTML = md(text);
    }).catch(function () {
      var box = $(target);
      if (box) box.innerHTML = '<div class="empty">Lesson text ready on disk. Open deck or serve over http.</div>';
    });
  }

  function wireEvents(route) {
    var view = $("#view");

    // Filter clicks
    Array.prototype.forEach.call(view.querySelectorAll("[data-f]"), function (el) {
      var k = el.getAttribute("data-f");
      if (el.tagName === "SELECT") {
        el.addEventListener("change", function () { filters[k] = el.value; render(); });
      } else {
        el.addEventListener("click", function () { filters[k] = el.getAttribute("data-v"); render(); });
      }
    });

    // Seal toggles
    Array.prototype.forEach.call(view.querySelectorAll(".btn-seal-toggle"), function (el) {
      el.addEventListener("click", function () {
        var door = el.getAttribute("data-door");
        toggleSealDoor(door);
      });
    });

    // Student delete
    Array.prototype.forEach.call(view.querySelectorAll(".btn-del-student"), function (el) {
      el.addEventListener("click", function () {
        var id = el.getAttribute("data-id");
        hub.students = hub.students.filter(function (s) { return s.id !== id; });
        saveHub(); render();
      });
    });

    // Student Add
    var sAdd = $("#s-add", view);
    if (sAdd) {
      sAdd.addEventListener("click", function () {
        var n = $("#s-name", view).value.trim();
        var c = $("#s-class", view).value.trim();
        if (!n) return;
        hub.students.push({ id: "s" + (hub.seq++), name: n, klass: c || "4A" });
        saveHub(); render();
      });
    }

    // Interactive Map Waypoints
    if (route.name === "map") {
      var markers = view.querySelectorAll(".gate-marker");
      Array.prototype.forEach.call(markers, function (m) {
        m.addEventListener("click", function () {
          var gNo = parseInt(m.getAttribute("data-gate"), 10);
          var g = DATA.gates.find(function (gate) { return gate.topic === gNo; });
          if (!g) return;
          AudioEngine.chime(440 + gNo * 30, 0.2);
          $("#dossier-name").innerText = "Gate " + g.topic + " · " + g.name;
          $("#dossier-lead").innerText = g.lead + " (" + g.guild + ")";
          var doors = DATA.lessons.filter(function (l) { return l.topic === g.topic; });
          var s = sijill();
          $("#dossier-content").innerHTML = '' +
            '<div style="background:var(--surface-inset);padding:10px 12px;border-radius:6px;font-size:12.5px;color:var(--ink);">' +
              '<strong>Commission:</strong> ' + esc(g.commission) +
            '</div>' +
            '<div style="background:var(--surface-inset);padding:10px 12px;border-radius:6px;font-size:12.5px;color:var(--ink);">' +
              '<strong>Concrete Twin:</strong> ' + esc(g.twin) +
            '</div>' +
            '<h5 style="font-size:11.5px;text-transform:uppercase;color:var(--muted);margin-top:6px;">Doors (' + doors.length + '):</h5>' +
            doors.map(function (d) {
              var isDone = s[d.code] && s[d.code].done;
              return '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px;background:var(--surface);border:1px solid var(--line);border-radius:6px;font-size:12px;">' +
                '<span><strong>' + d.code + '</strong> ' + esc(d.title) + '</span>' +
                '<button class="btn btn-sm btn-seal-toggle" data-door="' + d.code + '" style="padding:2px 8px;font-size:10.5px;">' + (isDone ? "✓ Sealed" : "Seal") + '</button>' +
              '</div>';
            }).join("");
          // Re-wire new seal buttons
          Array.prototype.forEach.call($("#dossier-content").querySelectorAll(".btn-seal-toggle"), function (b) {
            b.addEventListener("click", function () { toggleSealDoor(b.getAttribute("data-door")); });
          });
        });
      });

      var btnMarch = $("#btn-caravan-walk", view);
      if (btnMarch) {
        btnMarch.addEventListener("click", function () {
          var marker = $("#caravan-marker", view);
          if (!marker) return;
          var step = 0;
          var pts = [
            {x: 60, y: 180}, {x: 230, y: 220}, {x: 400, y: 240}, {x: 600, y: 380}, {x: 850, y: 560}
          ];
          var timer = setInterval(function () {
            if (step >= pts.length) { clearInterval(timer); AudioEngine.stone(); return; }
            marker.setAttribute("transform", "translate(" + pts[step].x + "," + pts[step].y + ")");
            AudioEngine.caravan();
            step++;
          }, 600);
        });
      }
    }

    // Mini-Games launcher
    if (route.name === "games") {
      var arena = $("#interactive-game-arena", view);
      var mount = $("#arena-body-mount", view);
      var closeBtn = $("#arena-close-btn", view);
      if (closeBtn) closeBtn.addEventListener("click", function () { arena.style.display = "none"; });

      var btnLantern = $("#btn-start-lantern", view);
      if (btnLantern) {
        btnLantern.addEventListener("click", function () {
          arena.style.display = "block";
          $("#arena-game-title").innerText = "🏮 Lantern Drill ×2–×12 (Sitr Private Trainer)";
          var a = Math.floor(Math.random() * 11) + 2;
          var b = Math.floor(Math.random() * 11) + 2;
          var ans = a * b;
          mount.innerHTML = '' +
            '<div style="max-width:400px;margin:0 auto;text-align:center;">' +
              '<div class="drill-math-card" id="drill-q">' + a + ' × ' + b + '</div>' +
              '<div style="display:flex;gap:10px;margin-bottom:12px;">' +
                '<input id="drill-ans" type="number" placeholder="Enter product…" class="filter-select" style="font-size:22px;text-align:center;height:48px;flex:1;" />' +
                '<button id="drill-submit" class="btn btn-primary">Check</button>' +
              '</div>' +
              '<div id="drill-msg" style="font-size:13px;color:var(--muted);">Private Sitr Mode: Errors are private, successes add golden pebbles.</div>' +
            '</div>';
          $("#drill-ans").focus();
          function checkAns() {
            var val = parseInt($("#drill-ans").value, 10);
            if (val === ans) {
              AudioEngine.chime(660, 0.3);
              hub.pebbles = (hub.pebbles || 0) + 1;
              saveHub();
              $("#drill-msg").innerHTML = '<span style="color:var(--pass);font-weight:700;">✓ Correct! +1 Golden Pebble added to caravan vessel.</span>';
              setTimeout(function () { btnLantern.click(); }, 1200);
            } else {
              AudioEngine.stone();
              $("#drill-msg").innerHTML = '<span style="color:var(--danger);font-weight:600;">Check again privately. (Sitr shield active)</span>';
            }
          }
          $("#drill-submit").addEventListener("click", checkAns);
          $("#drill-ans").addEventListener("keydown", function (e) { if (e.key === "Enter") checkAns(); });
        });
      }

      var btnCritic = $("#btn-start-critic", view);
      if (btnCritic) {
        btnCritic.addEventListener("click", function () {
          arena.style.display = "block";
          $("#arena-game-title").innerText = "⚖️ Misbah Stage 4 AI Critic Challenge";
          mount.innerHTML = '' +
            '<div style="background:var(--surface-inset);padding:18px;border-radius:8px;margin-bottom:16px;">' +
              '<strong style="color:var(--teal-deep);font-size:13px;">Caravan Dilemma (Door 5-4):</strong>' +
              '<p style="font-size:13.5px;color:var(--ink);margin-top:6px;">' +
                '"The water master has 125 liters of water to distribute equally among 4 camels. Misbah states that each camel receives exactly 31 liters and the remaining 1 liter is thrown away into the sand."' +
              '</p>' +
            '</div>' +
            '<div style="margin-bottom:14px;">' +
              '<label style="font-size:12px;font-weight:700;color:var(--muted);display:block;margin-bottom:6px;">Select the Mathematical Violation:</label>' +
              '<select id="critic-select" class="filter-select" style="width:100%;">' +
                '<option value="0">Select diagnosis…</option>' +
                '<option value="1">Incorrect remainder interpretation: In the desert, remainders are stored or partitioned as fractions.</option>' +
                '<option value="2">Place value regrouping error in partial quotients.</option>' +
                '<option value="3">Division algorithm calculated 125 ÷ 4 as 30 R5.</option>' +
              '</select>' +
            '</div>' +
            '<button id="critic-submit" class="btn btn-primary">Submit Mathematical Verdict</button>' +
            '<div id="critic-feedback" style="margin-top:12px;font-size:13px;"></div>';

          $("#critic-submit").addEventListener("click", function () {
            var val = $("#critic-select").value;
            if (val === "1") {
              AudioEngine.chime(700, 0.3);
              $("#critic-feedback").innerHTML = '<span style="color:var(--pass);font-weight:700;">✓ Master Inspector Judgment! In real-world context, remainders must be converted to fraction fractions (31 ¼ L) or carried.</span>';
            } else {
              AudioEngine.stone();
              $("#critic-feedback").innerHTML = '<span style="color:var(--warn);font-weight:600;">Re-read the desert context carefully. Why is water never discarded?</span>';
            }
          });
        });
      }

      var btnSouq = $("#btn-start-souq", view);
      if (btnSouq) {
        btnSouq.addEventListener("click", function () {
          arena.style.display = "block";
          $("#arena-game-title").innerText = "🪙 Dakkan al-Halalah Cashier (Market Day Trade)";
          var itemCost = (Math.floor(Math.random() * 45) + 5) + 0.5;
          var paid = 100;
          var expectedChange = (paid - itemCost).toFixed(2);
          mount.innerHTML = '' +
            '<div style="max-width:440px;margin:0 auto;text-align:center;">' +
              '<div style="background:var(--surface-inset);padding:16px;border-radius:8px;margin-bottom:14px;">' +
                '<div style="font-size:12px;color:var(--muted);text-transform:uppercase;">Customer Purchase</div>' +
                '<div style="font-size:22px;font-weight:700;color:var(--ink);margin:4px 0;">Total: ' + itemCost.toFixed(2) + ' SAR</div>' +
                '<div style="font-size:13px;color:var(--teal-deep);">Paid with a 100 SAR note</div>' +
              '</div>' +
              '<div style="display:flex;gap:10px;margin-bottom:12px;">' +
                '<input id="souq-ans" type="number" step="0.01" placeholder="Change SAR…" class="filter-select" style="font-size:20px;text-align:center;height:48px;flex:1;" />' +
                '<button id="souq-submit" class="btn btn-primary">Return Change</button>' +
              '</div>' +
              '<div id="souq-msg" style="font-size:13px;color:var(--muted);">Calculate exact change to maintain trade trust in the souq.</div>' +
            '</div>';
          $("#souq-ans").focus();
          function checkSouq() {
            var val = parseFloat($("#souq-ans").value);
            if (Math.abs(val - parseFloat(expectedChange)) < 0.01) {
              AudioEngine.chime(660, 0.3);
              hub.pebbles = (hub.pebbles || 0) + 1;
              saveHub();
              $("#souq-msg").innerHTML = '<span style="color:var(--pass);font-weight:700;">✓ Trade Settled! Exactly ' + expectedChange + ' SAR change returned.</span>';
              setTimeout(function () { btnSouq.click(); }, 1200);
            } else {
              AudioEngine.stone();
              $("#souq-msg").innerHTML = '<span style="color:var(--danger);font-weight:600;">Incorrect change calculation. Subtract from 100.00 SAR.</span>';
            }
          }
          $("#souq-submit").addEventListener("click", checkSouq);
          $("#souq-ans").addEventListener("keydown", function (e) { if (e.key === "Enter") checkSouq(); });
        });
      }
    }
  }

  /* ----------------------------------------------------------- startup -- */
  function chrome() {
    var savedTheme = localStorage.getItem("daf.hub.theme") || "light";
    if (savedTheme === "dark") document.documentElement.setAttribute("data-theme", "dark");

    $("#theme").addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme");
      var now = cur === "dark" ? "light" : "dark";
      if (now === "dark") document.documentElement.setAttribute("data-theme", "dark");
      else document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("daf.hub.theme", now);
    });

    $("#burger").addEventListener("click", function () {
      document.getElementById("app").classList.toggle("nav-open");
    });

    var box = $("#search");
    var timer;
    box.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        query = box.value;
        var here = parseHash().name;
        if (query && here !== "lessons" && here !== "experiences") location.hash = "#/lessons";
        else render();
      }, 120);
    });

    window.addEventListener("hashchange", render);
  }

  // Use embedded JSON fallback if fetch is blocked offline
  DATA = {"school": "Dar Al Fikr Boys School, Jeddah", "motto": "Faith, Righteousness and Wisdom", "mottoAr": "الإيمان والاستقامة والحكمة", "course": "enVision Mathematics — Grade 4", "year": "2026–2027", "lessons": [{"code": "1-1", "title": "Numbers Through One Million", "semester": 1, "topic": 1, "topicTitle": "Generalize Place Value Understanding", "week": 2, "optional": false, "path": "../semester1/lessons/1-1-numbers-through-one-million.md", "objective": "read and write numbers through one million in expanded form, with numerals, and using number names.", "place": "Sahat al-Misbah · Lantern Court", "rifqah": "al-Misbah", "hook": "*Misbah is lit. The Dust ate a zero. The seven boxes are 356,039.*", "setting": "Al-Balad exchange · Amm Fahad, Jadd Khalid", "task": "Restore the 0 · pack ten SAR 100 · place the till-door", "twin": "Place-Value Cups & Glass Marbles (Base 10 grouping)", "commission": "School Census Record: Survey Grade 4 student population, group by tens/hundreds, and draft the caravan register.", "production": {"A": "Write the deposit slip (three forms, his name)", "B": "Hang a till poster (one sentence he writes)"}, "deck": null}, {"code": "1-2", "title": "Place Value Relationships", "semester": 1, "topic": 1, "topicTitle": "Generalize Place Value Understanding", "week": 2, "optional": false, "path": "../semester1/lessons/1-2-place-value-relationships.md", "objective": "recognize that a digit in one place has ten times the value of the same digit in the place to its right.", "place": "Sahat al-Misbah · a cube slides one chair", "rifqah": "al-Nakhl", "hook": "*Misbah is lit. A digit walked left. The court grew.*", "setting": "Palm warehouse · Abu Yusuf", "task": "Slide a crate one chair (×10 / ÷10) · pack ten 100-flats", "twin": "Place-Value Cups & Glass Marbles (Base 10 grouping)", "commission": "School Census Record: Survey Grade 4 student population, group by tens/hundreds, and draft the caravan register.", "production": {"A": "Tag the shelves 5 / 50 / 500 / 5,000", "B": "Perform the warehouse chant (four blanks)"}, "deck": null}, {"code": "1-3", "title": "Compare Whole Numbers", "semester": 1, "topic": 1, "topicTitle": "Generalize Place Value Understanding", "week": 2, "optional": false, "path": "../semester1/lessons/1-3-compare-whole-numbers.md", "objective": "use place value to compare numbers and record my comparisons using >, <, or =.", "place": "Sahat al-Misbah · two wells, one water", "rifqah": "al-Bi’r", "hook": "*Misbah is lit. Two claims. Both shout more.*", "setting": "Well inspector · Khal Saud", "task": "Drive a scanner L→R; stop at first difference", "twin": "Place-Value Cups & Glass Marbles (Base 10 grouping)", "commission": "School Census Record: Survey Grade 4 student population, group by tens/hundreds, and draft the caravan register.", "production": {"A": "Comparison stamp 6,356 < 6,378 tens named", "B": "Two-well A5 poster with stop marked"}, "deck": null}, {"code": "1-4", "title": "Round Whole Numbers", "semester": 1, "topic": 1, "topicTitle": "Generalize Place Value Understanding", "week": 3, "optional": false, "path": "../semester1/lessons/1-4-round-whole-numbers.md", "objective": "use place value to round numbers.", "place": "Sahat al-Misbah · after sunset", "rifqah": "al-Misbah", "hook": "*Misbah is lit. Exact count comes after dark. Ghubar loves pretty numbers.*", "setting": "Night ranger · Jadd", "task": "Place a dot vs halfway; paint a band", "twin": "Place-Value Cups & Glass Marbles (Base 10 grouping)", "commission": "School Census Record: Survey Grade 4 student population, group by tens/hundreds, and draft the caravan register.", "production": {"A": "Ranger report 181,376 → 181,000 + band", "B": "Mind map: number → halfway → left/right → rounded"}, "deck": null}, {"code": "2-1", "title": "Finding Sums and Differences with Mental Math", "semester": 1, "topic": 2, "topicTitle": "Fluently Add and Subtract Multi-Digit Whole Numbers", "week": 3, "optional": false, "path": "../semester1/lessons/2-1-finding-sums-and-differences-with-mental-math.md", "objective": "use properties and strategies to change a problem to add and subtract with mental math.", "place": "Diwan al-Hisab · Counting House", "rifqah": "al-Bi’r", "hook": "*The clerks add in their heads so the Dust cannot nibble the paper.*", "setting": "Head-clerk · Amm · no paper", "task": "Add 1,034+1,289+1,566 in the head", "twin": "Brass Two-Pan Balance & Date Seed Counterweights", "commission": "Recycling Weigh-in Audit: Weigh cardboard and plastic bales, calculate sums, differences, and net valley cargo.", "production": {"A": "Strategy card: I broke ___ because ___", "B": "AI critic: three amanah questions on HIS steps"}, "deck": null}, {"code": "2-2", "title": "Estimate Sums and Differences", "semester": 1, "topic": 2, "topicTitle": "Fluently Add and Subtract Multi-Digit Whole Numbers", "week": 4, "optional": false, "path": "../semester1/lessons/2-2-estimate-sums-and-differences.md", "objective": "use rounding and place value to estimate sums and differences.", "place": "Diwan al-Hisab · the truck at the gate", "rifqah": "al-Bi’r", "hook": "*Too heavy and the well-road cracks. Estimate first — honestly.*", "setting": "Gate of the well-road · Jubail truck", "task": "Estimate vs 15,000 before the truck rolls", "twin": "Brass Two-Pan Balance & Date Seed Counterweights", "commission": "Recycling Weigh-in Audit: Weigh cardboard and plastic bales, calculate sums, differences, and net valley cargo.", "production": {"A": "Gate pass: rounded addends + go/no-go", "B": "Truck sketch with three loads labelled"}, "deck": null}, {"code": "2-3", "title": "Add Whole Numbers", "semester": 1, "topic": 2, "topicTitle": "Fluently Add and Subtract Multi-Digit Whole Numbers", "week": 4, "optional": false, "path": "../semester1/lessons/2-3-add-whole-numbers.md", "objective": "connect place-value concepts to using addition algorithms.", "place": "Diwan al-Hisab · three months of bottles", "rifqah": "al-Bi’r", "hook": "*One stack. Line the places or Ghubar steals a hundred.*", "setting": "Recycling stack · three months", "task": "Line 357+243+468; partial sums", "twin": "Brass Two-Pan Balance & Date Seed Counterweights", "commission": "Recycling Weigh-in Audit: Weigh cardboard and plastic bales, calculate sums, differences, and net valley cargo.", "production": {"A": "Stack ticket with places lined", "B": "Column poster: one place gold"}, "deck": null}, {"code": "2-4", "title": "Add Greater Numbers", "semester": 1, "topic": 2, "topicTitle": "Fluently Add and Subtract Multi-Digit Whole Numbers", "week": 4, "optional": false, "path": "../semester1/lessons/2-4-add-greater-numbers.md", "objective": "use the standard algorithm and place value to add multi-digit numbers.", "place": "Diwan al-Hisab · the beam groans", "rifqah": "al-Bi’r", "hook": "*Thousands of bottles. Every place has a seat.*", "setting": "Three classes of bottles · Abu", "task": "Standard algorithm; name each place", "twin": "Brass Two-Pan Balance & Date Seed Counterweights", "commission": "Recycling Weigh-in Audit: Weigh cardboard and plastic bales, calculate sums, differences, and net valley cargo.", "production": {"A": "Weighbill, places named", "B": "Two lines from Iqra: why lining up is amanah"}, "deck": null}, {"code": "2-5", "title": "Subtract Whole Numbers", "semester": 1, "topic": 2, "topicTitle": "Fluently Add and Subtract Multi-Digit Whole Numbers", "week": 5, "optional": false, "path": "../semester1/lessons/2-5-subtract-whole-numbers.md", "objective": "connect place-value concepts to using the standard algorithm for subtraction.", "place": "Diwan al-Hisab · dark windows", "rifqah": "al-Bi’r", "hook": "*224 rooms. 176 slept. How many stay dark?*", "setting": "Night watch · 224 rooms", "task": "Subtract what doesn’t fit", "twin": "Brass Two-Pan Balance & Date Seed Counterweights", "commission": "Recycling Weigh-in Audit: Weigh cardboard and plastic bales, calculate sums, differences, and net valley cargo.", "production": {"A": "Watch sheet: take-away shown", "B": "Window-grid diagram of the subtract"}, "deck": null}, {"code": "2-6", "title": "Subtract Greater Numbers", "semester": 1, "topic": 2, "topicTitle": "Fluently Add and Subtract Multi-Digit Whole Numbers", "week": 5, "optional": false, "path": "../semester1/lessons/2-6-subtract-greater-numbers.md", "objective": "use the standard algorithm and place value to subtract whole numbers.", "place": "Diwan al-Hisab · two regions", "rifqah": "al-Bi’r", "hook": "*Which land is larger — and by how much, not by shouting?*", "setting": "Two regions · Najran vs Al-Madinah", "task": "Subtract on a chart; no stolen left digit", "twin": "Brass Two-Pan Balance & Date Seed Counterweights", "commission": "Recycling Weigh-in Audit: Weigh cardboard and plastic bales, calculate sums, differences, and net valley cargo.", "production": {"A": "Difference chart signed", "B": "Two-region mini-map with the difference"}, "deck": null}, {"code": "2-7", "title": "Subtract Across Zeros", "semester": 1, "topic": 2, "topicTitle": "Fluently Add and Subtract Multi-Digit Whole Numbers", "week": 5, "optional": false, "path": "../semester1/lessons/2-7-subtract-across-zeros.md", "objective": "use the standard algorithm to subtract from numbers with zeros.", "place": "Diwan al-Hisab · empty wells", "rifqah": "al-Bi’r", "hook": "*Zeros in a row. Ghubar lives here. Do not be afraid to break them.*", "setting": "Milestones from Makkah", "task": "Subtract across zeros; each regroup marked", "twin": "Brass Two-Pan Balance & Date Seed Counterweights", "commission": "Recycling Weigh-in Audit: Weigh cardboard and plastic bales, calculate sums, differences, and net valley cargo.", "production": {"A": "Road log: every regroup inked", "B": "Four-line chant: a zero is a seat"}, "deck": null}, {"code": "3-1", "title": "Multiply by Multiples of 10, 100, and 1,000", "semester": 1, "topic": 3, "topicTitle": "Use Strategies and Properties to Multiply by 1-Digit Numbers", "week": 6, "optional": false, "path": "../semester1/lessons/3-1-multiply-by-multiples-of-10-100-and-1-000.md", "objective": "find the products of multiples of 10, 100, and 1,000 using mental math and place-value strategies.", "place": "Nakhil Yusuf · Palm Nursery", "rifqah": "al-Nakhl", "hook": "*Same 3. Seats of 4, 40, 400, 4,000. Listen: the leaves count in tens.*", "setting": "Yusuf walking pots at dusk", "task": "Same 3, chairs change ×4 / ×40 / ×400 / ×4,000", "twin": "Pegboard Matrix & Colored Elastic Bands (Area Arrays)", "commission": "Date Nursery Planting Grid: Plot 8 irrigation rows with 240 palm saplings each and verify yield using partial products.", "production": {"A": "Zero-pattern strip", "B": "Pot-row drawing: same 3, chairs change"}, "deck": null}, {"code": "3-2", "title": "Estimate Products", "semester": 1, "topic": 3, "topicTitle": "Use Strategies and Properties to Multiply by 1-Digit Numbers", "week": 6, "optional": false, "path": "../semester1/lessons/3-2-estimate-products.md", "objective": "use rounding to estimate products and check if my answer is reasonable.", "place": "Nakhil Yusuf · Saud’s wages", "rifqah": "al-Nakhl", "hook": "*About how much — before the exact? Ghubar sells ‘about’ as ‘is’.*", "setting": "Saud’s tutoring wages · Amm", "task": "Estimate SAR 48×6 before exact", "twin": "Pegboard Matrix & Colored Elastic Bands (Area Arrays)", "commission": "Date Nursery Planting Grid: Plot 8 irrigation rows with 240 palm saplings each and verify yield using partial products.", "production": {"A": "Wage envelope: compatible then exact", "B": "Mind map: compatible vs exact"}, "deck": null}, {"code": "3-3", "title": "Use Arrays and Partial Products to Multiply", "semester": 1, "topic": 3, "topicTitle": "Use Strategies and Properties to Multiply by 1-Digit Numbers", "week": 6, "optional": false, "path": "../semester1/lessons/3-3-use-arrays-and-partial-products-to-multiply.md", "objective": "use arrays and partial products to multiply.", "place": "Nakhil Yusuf · chairs in the shade", "rifqah": "al-Nakhl", "hook": "*6 rows of 18. Array or partials — both must tell the truth.*", "setting": "Music-shade chairs · 6×18", "task": "Build the array; split partial products", "twin": "Pegboard Matrix & Colored Elastic Bands (Area Arrays)", "commission": "Date Nursery Planting Grid: Plot 8 irrigation rows with 240 palm saplings each and verify yield using partial products.", "production": {"A": "Array labelled", "B": "Chair-hall sketch tens+ones"}, "deck": null}, {"code": "3-4", "title": "Use Area Models and Partial Products to Multiply", "semester": 1, "topic": 3, "topicTitle": "Use Strategies and Properties to Multiply by 1-Digit Numbers", "week": 7, "optional": false, "path": "../semester1/lessons/3-4-use-area-models-and-partial-products-to-multiply.md", "objective": "use area models and partial products to multiply.", "place": "Nakhil Yusuf · unshaded wall", "rifqah": "al-Nakhl", "hook": "*Only the given numbers may speak.*", "setting": "Unshaded nursery wall", "task": "Area model; only given sides speak", "twin": "Pegboard Matrix & Colored Elastic Bands (Area Arrays)", "commission": "Date Nursery Planting Grid: Plot 8 irrigation rows with 240 palm saplings each and verify yield using partial products.", "production": {"A": "Area model, no invented side", "B": "AI critic on his area"}, "deck": null}, {"code": "3-6", "title": "Mental Math Strategies for Multiplication", "semester": 1, "topic": 3, "topicTitle": "Use Strategies and Properties to Multiply by 1-Digit Numbers", "week": 7, "optional": false, "path": "../semester1/lessons/3-6-mental-math-strategies-for-multiplication.md", "objective": "use mental math strategies based on place value and properties of operations to multiply.", "place": "Nakhil Yusuf · no paper", "rifqah": "al-Nakhl", "hook": "*Mental math. No paper for Ghubar to eat.*", "setting": "No paper under the palms", "task": "Mental product; name the property", "twin": "Pegboard Matrix & Colored Elastic Bands (Area Arrays)", "commission": "Date Nursery Planting Grid: Plot 8 irrigation rows with 240 palm saplings each and verify yield using partial products.", "production": {"A": "Property card", "B": "20-sec voice: product + property"}, "deck": null}, {"code": "3-8", "title": "Model with Math (Problem Solving)", "semester": 1, "topic": 3, "topicTitle": "Use Strategies and Properties to Multiply by 1-Digit Numbers", "week": 7, "optional": false, "path": "../semester1/lessons/3-8-model-with-math-problem-solving.md", "objective": "apply the math I know to solve problems.", "place": "Nakhil Yusuf · twice as many photos", "rifqah": "al-Nakhl", "hook": "*Two boys. A hidden question. Omar will not let Ghubar answer the first and run.*", "setting": "Two boys, photos, twice as many", "task": "Bar: hidden question", "twin": "Pegboard Matrix & Colored Elastic Bands (Area Arrays)", "commission": "Date Nursery Planting Grid: Plot 8 irrigation rows with 240 palm saplings each and verify yield using partial products.", "production": {"A": "Bar diagram signed", "B": "Two-panel comic: hidden ask in panel 2"}, "deck": null}, {"code": "4-1", "title": "Multiply Multiples of 10", "semester": 1, "topic": 4, "topicTitle": "Use Strategies and Properties to Multiply by 2-Digit Numbers", "week": 8, "optional": false, "path": "../semester1/lessons/4-1-multiply-multiples-of-10.md", "objective": "use place-value strategies or properties of operations to multiply by multiples of 10.", "place": "Mashghala al-Qawafil · Caravan Workshop", "rifqah": "al-Nakhl", "hook": "*20 rooms × 20 desks, 30 chairs, 40 pencils. Tens of tens.*", "setting": "Principal’s order · 20 rooms", "task": "×10 without a lost zero", "twin": "Cuisenaire Rod Grids & Segmented Base-10 Tiles", "commission": "Caravan Load Box Grid: Calculate weight distributions for 24 camels carrying 35 standard sacks each.", "production": {"A": "Order form, jump shown", "B": "Classroom sketch with tens packs"}, "deck": null}, {"code": "4-2", "title": "Use Models to Multiply 2-Digit Numbers by Multiples of 10", "semester": 1, "topic": 4, "topicTitle": "Use Strategies and Properties to Multiply by 2-Digit Numbers", "week": 8, "optional": false, "path": "../semester1/lessons/4-2-use-models-to-multiply-2-digit-numbers-by-multiples-of-10.md", "objective": "use models and properties of operations to help multiply.", "place": "Mashghala al-Qawafil · ten teams", "rifqah": "al-Nakhl", "hook": "*10 teams, 25 players. The ten-pack must stay a ten-pack.*", "setting": "Football kit · 10×25", "task": "Area of tens", "twin": "Cuisenaire Rod Grids & Segmented Base-10 Tiles", "commission": "Caravan Load Box Grid: Calculate weight distributions for 24 camels carrying 35 standard sacks each.", "production": {"A": "Team sheet", "B": "A5 kit poster: 10 teams, 25 jerseys"}, "deck": null}, {"code": "4-3", "title": "Estimate: Use Rounding or Compatible Numbers", "semester": 1, "topic": 4, "topicTitle": "Use Strategies and Properties to Multiply by 2-Digit Numbers", "week": 8, "optional": false, "path": "../semester1/lessons/4-3-estimate-use-rounding-or-compatible-numbers.md", "objective": "use rounding or compatible numbers to estimate.", "place": "Mashghala al-Qawafil · nearest 1,600", "rifqah": "al-Nakhl", "hook": "*Which two factors sit closest without lying?*", "setting": "Load nearest 1,600 without lying", "task": "Pick factors; rounding shown", "twin": "Cuisenaire Rod Grids & Segmented Base-10 Tiles", "commission": "Caravan Load Box Grid: Calculate weight distributions for 24 camels carrying 35 standard sacks each.", "production": {"A": "Estimate card vs exact", "B": "Mind map: round → multiply → check"}, "deck": null}, {"code": "4-4", "title": "Use Arrays and Partial Products to Multiply 2-Digit Numbers", "semester": 1, "topic": 4, "topicTitle": "Use Strategies and Properties to Multiply by 2-Digit Numbers", "week": 8, "optional": false, "path": "../semester1/lessons/4-4-use-arrays-and-partial-products-to-multiply-2-digit-numbers.md", "objective": "use grid arrays and partial products to multiply two 2-digit numbers.", "place": "Mashghala al-Qawafil · mosaic tiles", "rifqah": "al-Nakhl", "hook": "*14 rows of 16 tiles. Every square is accounted for.*", "setting": "Artisan tile workshop · Abu", "task": "Grid array with 4 partial product quadrants", "twin": "Cuisenaire Rod Grids & Segmented Base-10 Tiles", "commission": "Caravan Load Box Grid: Calculate weight distributions for 24 camels carrying 35 standard sacks each.", "production": {"A": "Tile array waybill with 4 partial products", "B": "Mosaic plan card: 14 × 16 with labelled quadrants"}, "deck": null}, {"code": "4-5", "title": "Area Models and Partial Products", "semester": 1, "topic": 4, "topicTitle": "Use Strategies and Properties to Multiply by 2-Digit Numbers", "week": 9, "optional": false, "path": "../semester1/lessons/4-5-area-models-and-partial-products.md", "objective": "use area models and properties of operations to multiply two 2-digit numbers.", "place": "Mashghala al-Qawafil · four sections", "rifqah": "al-Nakhl", "hook": "*Distributive property is the honest split.*", "setting": "Playground in four sections · Abu", "task": "Four partial products; no section twice", "twin": "Cuisenaire Rod Grids & Segmented Base-10 Tiles", "commission": "Caravan Load Box Grid: Calculate weight distributions for 24 camels carrying 35 standard sacks each.", "production": {"A": "Four-partial waybill", "B": "Playground plan with four products"}, "deck": null}, {"code": "5-1", "title": "Mental Math: Find Quotients", "semester": 1, "topic": 5, "topicTitle": "Use Strategies and Properties to Divide by 1-Digit Numbers", "week": 9, "optional": false, "path": "../semester1/lessons/5-1-mental-math-find-quotients.md", "objective": "make sense of quantities and use mental math and place-value strategies to divide.", "place": "Qismat al-Ma’ · Water-Sharing", "rifqah": "al-Bi’r", "hook": "*270 cards, 9 boxes, equal. Equal is a trust.*", "setting": "Yusuf’s 270 cards into 9 boxes", "task": "Mental ÷ equal share", "twin": "Volumetric Graduated Beakers & Pipettes (Water Division)", "commission": "Solar Desalination Still: Measure condensation yield, divide evenly among cisterns, and interpret remaining liters.", "production": {"A": "Nine box labels = 30", "B": "Four-line equal-share chant"}, "deck": null}, {"code": "5-2", "title": "Mental Math: Estimate Quotients", "semester": 1, "topic": 5, "topicTitle": "Use Strategies and Properties to Divide by 1-Digit Numbers", "week": 9, "optional": false, "path": "../semester1/lessons/5-2-mental-math-estimate-quotients.md", "objective": "use compatible numbers to estimate quotients when dividing with 3-digit dividends.", "place": "Qismat al-Ma’ · about how many tickets", "rifqah": "al-Bi’r", "hook": "*248 tickets, 3 friends. About — honestly.*", "setting": "248 tickets, 3 friends · about", "task": "Estimate; compatible numbers", "twin": "Volumetric Graduated Beakers & Pipettes (Water Division)", "commission": "Solar Desalination Still: Measure condensation yield, divide evenly among cisterns, and interpret remaining liters.", "production": {"A": "About ___ each ticket", "B": "Mind map: compatible for ÷"}, "deck": null}, {"code": "5-3", "title": "Mental Math: Estimate Quotients for Greater Dividends", "semester": 1, "topic": 5, "topicTitle": "Use Strategies and Properties to Divide by 1-Digit Numbers", "week": 10, "optional": false, "path": "../semester1/lessons/5-3-mental-math-estimate-quotients-for-greater-dividends.md", "objective": "estimate quotients for 4-digit dividends.", "place": "Qismat al-Ma’ · 3,000 in 8s", "rifqah": "al-Bi’r", "hook": "*Greater dividend. Same honesty, longer road.*", "setting": "Jassim’s carnival · 3,000 in 8s", "task": "4-digit estimate", "twin": "Volumetric Graduated Beakers & Pipettes (Water Division)", "commission": "Solar Desalination Still: Measure condensation yield, divide evenly among cisterns, and interpret remaining liters.", "production": {"A": "Group-estimate slip", "B": "Two lines: why about is still amanah"}, "deck": null}, {"code": "5-4", "title": "Interpret Remainders", "semester": 1, "topic": 5, "topicTitle": "Use Strategies and Properties to Divide by 1-Digit Numbers", "week": 10, "optional": false, "path": "../semester1/lessons/5-4-interpret-remainders.md", "objective": "apply what I know about dividing items into equal groups to solve problems.", "place": "Qismat al-Ma’ · the last cup", "rifqah": "al-Bi’r", "hook": "*What does the remainder mean? Ghubar calls it nothing.*", "setting": "Last cup in the tent line", "task": "Remainder is not nothing", "twin": "Volumetric Graduated Beakers & Pipettes (Water Division)", "commission": "Solar Desalination Still: Measure condensation yield, divide evenly among cisterns, and interpret remaining liters.", "production": {"A": "Serving note: leftover meaning", "B": "3-panel last-cup comic"}, "deck": null}, {"code": "5-5", "title": "Use Partial Quotients to Divide", "semester": 1, "topic": 5, "topicTitle": "Use Strategies and Properties to Divide by 1-Digit Numbers", "week": 10, "optional": false, "path": "../semester1/lessons/5-5-use-partial-quotients-to-divide.md", "objective": "divide by thinking about multiplication, estimation, properties, and place value.", "place": "Qismat al-Ma’ · take what you can", "rifqah": "al-Bi’r", "hook": "*Partial quotients: honest jumps, again.*", "setting": "Take what you can, honestly, again", "task": "Partial quotients; no jump too big", "twin": "Volumetric Graduated Beakers & Pipettes (Water Division)", "commission": "Solar Desalination Still: Measure condensation yield, divide evenly among cisterns, and interpret remaining liters.", "production": {"A": "Steps listed", "B": "AI critic: was a jump too big?"}, "deck": null}, {"code": "5-6", "title": "Use Partial Quotients to Divide: Greater Dividends", "semester": 1, "topic": 5, "topicTitle": "Use Strategies and Properties to Divide by 1-Digit Numbers", "week": 11, "optional": false, "path": "../semester1/lessons/5-6-use-partial-quotients-to-divide-greater-dividends.md", "objective": "divide by thinking about multiplication, estimation, and place value.", "place": "Qismat al-Ma’ · greater dividends", "rifqah": "al-Bi’r", "hook": "*Same honesty. Do not hide the leftover.*", "setting": "Longer road, greater dividend", "task": "Chart of subtracts", "twin": "Volumetric Graduated Beakers & Pipettes (Water Division)", "commission": "Solar Desalination Still: Measure condensation yield, divide evenly among cisterns, and interpret remaining liters.", "production": {"A": "Subtract chart", "B": "Poster: take what you can, again"}, "deck": null}, {"code": "6-1", "title": "Solve Comparison Problems", "semester": 1, "topic": 6, "topicTitle": "Use Operations with Whole Numbers to Solve Problems", "week": 11, "optional": false, "path": "../semester1/lessons/6-1-solve-comparison-problems.md", "objective": "use multiplication or addition to compare one quantity to another.", "place": "Souq al-Su’al · Market of the Hidden Question", "rifqah": "al-Misbah", "hook": "*How many times vs how many more. Ghubar answers the first word and runs.*", "setting": "Spice stall · times vs more", "task": "Two bars; label the word", "twin": "Strip Diagram Tape Ribbons & Market Price Slates", "commission": "Market Day Souq Budget: Manage stall inventory, track multi-step sales, compute hidden costs, and settle trade books.", "production": {"A": "Bar pair labelled", "B": "TIMES | MORE poster, one example each"}, "deck": null}, {"code": "6-2", "title": "Continue to Solve Comparison Problems", "semester": 1, "topic": 6, "topicTitle": "Use Operations with Whole Numbers to Solve Problems", "week": 11, "optional": false, "path": "../semester1/lessons/6-2-continue-to-solve-comparison-problems.md", "objective": "use multiplication or division to compare one quantity to another.", "place": "Souq al-Su’al · two bars", "rifqah": "al-Misbah", "hook": "*The comparison continues.*", "setting": "Rope stall · comparison continues", "task": "Both bars named", "twin": "Strip Diagram Tape Ribbons & Market Price Slates", "commission": "Market Day Souq Budget: Manage stall inventory, track multi-step sales, compute hidden costs, and settle trade books.", "production": {"A": "Two-bar receipt", "B": "20-sec voice: which word"}, "deck": "../slides/door-6-2.html"}, {"code": "6-3", "title": "Model Multi-Step Problems", "semester": 1, "topic": 6, "topicTitle": "Use Operations with Whole Numbers to Solve Problems", "week": 12, "optional": false, "path": "../semester1/lessons/6-3-model-multi-step-problems.md", "objective": "find hidden questions and use bar diagrams and equations to model and solve multi-step problems.", "place": "Souq al-Su’al · the whole trip", "rifqah": "al-Misbah", "hook": "*Model every stall, not one.*", "setting": "Whole souq trip", "task": "Strip diagram every step", "twin": "Strip Diagram Tape Ribbons & Market Price Slates", "commission": "Market Day Souq Budget: Manage stall inventory, track multi-step sales, compute hidden costs, and settle trade books.", "production": {"A": "Trip strip", "B": "Mind map: stall → stall → hidden ask"}, "deck": null}, {"code": "6-5", "title": "Solve Multi-Step Problems", "semester": 1, "topic": 6, "topicTitle": "Use Operations with Whole Numbers to Solve Problems", "week": 12, "optional": false, "path": "../semester1/lessons/6-5-solve-multi-step-problems.md", "objective": "solve multi-step problems by finding and solving hidden questions and by writing expressions and equations.", "place": "Souq al-Su’al · sabr", "rifqah": "al-Misbah", "hook": "*Solve the multi-step. First answer is not last.*", "setting": "Sabr at the qahwa queue", "task": "Multi-step; first answer is not last", "twin": "Strip Diagram Tape Ribbons & Market Price Slates", "commission": "Market Day Souq Budget: Manage stall inventory, track multi-step sales, compute hidden costs, and settle trade books.", "production": {"A": "All steps on one strip", "B": "AI critic: did he stop too soon?"}, "deck": null}, {"code": "6-6", "title": "Make Sense and Persevere (Problem Solving)", "semester": 1, "topic": 6, "topicTitle": "Use Operations with Whole Numbers to Solve Problems", "week": 12, "optional": false, "path": "../semester1/lessons/6-6-make-sense-and-persevere-problem-solving.md", "objective": "make sense of problems and keep working if I get stuck.", "place": "Souq al-Su’al · a second way", "rifqah": "al-Misbah", "hook": "*If stuck, another path. That is sabr.*", "setting": "If stuck, a second way", "task": "Two methods", "twin": "Strip Diagram Tape Ribbons & Market Price Slates", "commission": "Market Day Souq Budget: Manage stall inventory, track multi-step sales, compute hidden costs, and settle trade books.", "production": {"A": "Two methods signed", "B": "Sabr poster: a second way"}, "deck": null}, {"code": "7-1", "title": "Understand Factors", "semester": 1, "topic": 7, "topicTitle": "Factors and Multiples", "week": 13, "optional": false, "path": "../semester1/lessons/7-1-understand-factors.md", "objective": "find the factor pairs of a whole number.", "place": "Bayt al-Tamr · House of Dates", "rifqah": "al-Nakhl", "hook": "*What is a factor? A date that fits the box.*", "setting": "Jadd packing dates", "task": "What is a factor? Include 1", "twin": "Square Tile Grid Array Boards (Prime vs Composite)", "commission": "Date Crate Factor Sorting: Package 36 and 48 dates into all rectangular factor arrays and identify prime batches.", "production": {"A": "Factor-pair list", "B": "Date-box drawing: rows that fit"}, "deck": null}, {"code": "7-2", "title": "Factors", "semester": 1, "topic": 7, "topicTitle": "Factors and Multiples", "week": 13, "optional": false, "path": "../semester1/lessons/7-2-factors.md", "objective": "use multiplication to find the factor pairs for a whole number.", "place": "Bayt al-Tamr · find them all", "rifqah": "al-Nakhl", "hook": "*Miss one pair, Ghubar eats it.*", "setting": "Find every pair", "task": "Rainbow of pairs", "twin": "Square Tile Grid Array Boards (Prime vs Composite)", "commission": "Date Crate Factor Sorting: Package 36 and 48 dates into all rectangular factor arrays and identify prime batches.", "production": {"A": "Factor rainbow on the crate", "B": "Chant: miss one pair, Ghubar eats it"}, "deck": null}, {"code": "7-3", "title": "Repeated Reasoning (Problem Solving)", "semester": 1, "topic": 7, "topicTitle": "Factors and Multiples", "week": 13, "optional": false, "path": "../semester1/lessons/7-3-repeated-reasoning-problem-solving.md", "objective": "use repeated reasoning to generalize how to solve similar problems.", "place": "Bayt al-Tamr · the packing pattern", "rifqah": "al-Nakhl", "hook": "*Repeated reasoning. Do not claim the pattern too soon.*", "setting": "The packing pattern", "task": "Repeated reasoning", "twin": "Square Tile Grid Array Boards (Prime vs Composite)", "commission": "Date Crate Factor Sorting: Package 36 and 48 dates into all rectangular factor arrays and identify prime batches.", "production": {"A": "The repeat named", "B": "Pattern poster: three examples"}, "deck": null}, {"code": "7-4", "title": "Prime and Composite Numbers", "semester": 1, "topic": 7, "topicTitle": "Factors and Multiples", "week": 14, "optional": false, "path": "../semester1/lessons/7-4-prime-and-composite-numbers.md", "objective": "use factors to determine if a whole number is prime or composite.", "place": "Bayt al-Tamr · some boxes will not split", "rifqah": "al-Nakhl", "hook": "*Prime and composite. 1 is not a prime.*", "setting": "Some boxes will not split", "task": "Prime vs composite; 1 is not prime", "twin": "Square Tile Grid Array Boards (Prime vs Composite)", "commission": "Date Crate Factor Sorting: Package 36 and 48 dates into all rectangular factor arrays and identify prime batches.", "production": {"A": "Definition in his words", "B": "Two-column poster: will split / will not"}, "deck": null}, {"code": "7-5", "title": "Multiples", "semester": 1, "topic": 7, "topicTitle": "Factors and Multiples", "week": 14, "optional": false, "path": "../semester1/lessons/7-5-multiples.md", "objective": "use multiplication to find multiples of a number.", "place": "Bayt al-Tamr · the row that never ends", "rifqah": "al-Nakhl", "hook": "*Multiples. Stop honestly.*", "setting": "The row that never ends", "task": "First five multiples", "twin": "Square Tile Grid Array Boards (Prime vs Composite)", "commission": "Date Crate Factor Sorting: Package 36 and 48 dates into all rectangular factor arrays and identify prime batches.", "production": {"A": "Multiple strip", "B": "Mind map: factor vs multiple"}, "deck": null}, {"code": "8-1", "title": "Equivalent Fractions: Area Models (p. 293)", "semester": 1, "topic": 8, "topicTitle": "Extend Understanding of Fraction Equivalence and Ordering", "week": 1, "optional": false, "path": "../semester1/lessons/8-1-equivalent-fractions-area-models-p-293.md", "objective": "+ one Visual Learning example. 3–5 min / 1 page. |", "place": "Sahn al-Zill · Courtyard of Shade", "rifqah": "al-Najm", "hook": "*Same floor, two names. Area models.*", "setting": "Tile the shade · area", "task": "Same amount, cut finer", "twin": "Magnetic Transparent Fraction-Tiles & Fraction-Towers", "commission": "Courtyard Shadow Fraction Map: Measure shadow lengths at solar noon, generate equivalent fraction ratios on number lines.", "production": {"A": "Two area models, one amount", "B": "Tile drawing of the courtyard"}, "deck": null}, {"code": "8-2", "title": "Equivalent Fractions: Number Lines (p. 297)", "semester": 1, "topic": 8, "topicTitle": "Extend Understanding of Fraction Equivalence and Ordering", "week": 1, "optional": false, "path": "../semester1/lessons/8-2-equivalent-fractions-number-lines-p-297.md", "objective": "+ one Visual Learning example. 3–5 min / 1 page. |", "place": "Sahn al-Zill · the same place on the line", "rifqah": "al-Najm", "hook": "*Two fractions, one point.*", "setting": "Same place on the courtyard line", "task": "Two fractions, one point", "twin": "Magnetic Transparent Fraction-Tiles & Fraction-Towers", "commission": "Courtyard Shadow Fraction Map: Measure shadow lengths at solar noon, generate equivalent fraction ratios on number lines.", "production": {"A": "Number line with two names", "B": "Four-line same-place chant"}, "deck": null}, {"code": "8-3", "title": "Generate Equivalent Fractions: Multiplication (p. 301)", "semester": 1, "topic": 8, "topicTitle": "Extend Understanding of Fraction Equivalence and Ordering", "week": 1, "optional": false, "path": "../semester1/lessons/8-3-generate-equivalent-fractions-multiplication-p-301.md", "objective": "+ one Visual Learning example. 3–5 min / 1 page. |", "place": "Sahn al-Zill · grow the name, not the amount", "rifqah": "al-Najm", "hook": "*Multiply to equivalent. The shade does not grow.*", "setting": "Grow the name, not the amount", "task": "× same number top and bottom", "twin": "Magnetic Transparent Fraction-Tiles & Fraction-Towers", "commission": "Courtyard Shadow Fraction Map: Measure shadow lengths at solar noon, generate equivalent fraction ratios on number lines.", "production": {"A": "× card", "B": "Poster: grow the name, not the amount"}, "deck": null}, {"code": "8-4", "title": "Generate Equivalent Fractions: Division (p. 305)", "semester": 1, "topic": 8, "topicTitle": "Extend Understanding of Fraction Equivalence and Ordering", "week": 16, "optional": false, "path": "../semester1/lessons/8-4-generate-equivalent-fractions-division-p-305.md", "objective": "use division to find equivalent fractions.", "place": "Sahn al-Zill · shrink the name, not the amount", "rifqah": "al-Najm", "hook": "*Divide to equivalent.*", "setting": "Shrink the name, not the amount", "task": "÷ same", "twin": "Magnetic Transparent Fraction-Tiles & Fraction-Towers", "commission": "Courtyard Shadow Fraction Map: Measure shadow lengths at solar noon, generate equivalent fraction ratios on number lines.", "production": {"A": "÷ card", "B": "Mind map: × and ÷, same floor"}, "deck": null}, {"code": "8-5", "title": "Use Benchmarks to Compare Fractions (p. 309)", "semester": 1, "topic": 8, "topicTitle": "Extend Understanding of Fraction Equivalence and Ordering", "week": 16, "optional": false, "path": "../semester1/lessons/8-5-use-benchmarks-to-compare-fractions-p-309.md", "objective": "use benchmarks, area models, and number lines to compare fractions.", "place": "Sahn al-Zill · three lamps", "rifqah": "al-Najm", "hook": "*Benchmarks 0, ½, 1.*", "setting": "Three lamps: 0, ½, 1", "task": "Benchmark", "twin": "Magnetic Transparent Fraction-Tiles & Fraction-Towers", "commission": "Courtyard Shadow Fraction Map: Measure shadow lengths at solar noon, generate equivalent fraction ratios on number lines.", "production": {"A": "Benchmark card with his fraction", "B": "Three-lamp drawing"}, "deck": null}, {"code": "8-6", "title": "Compare Fractions (p. 313)", "semester": 1, "topic": 8, "topicTitle": "Extend Understanding of Fraction Equivalence and Ordering", "week": 16, "optional": false, "path": "../semester1/lessons/8-6-compare-fractions-p-313.md", "objective": "use equivalent fractions to compare fractions.", "place": "Sahn al-Zill · same shade or not?", "rifqah": "al-Najm", "hook": "*Compare. Evidence, not volume.*", "setting": "Same shade or not?", "task": "Compare with a why", "twin": "Magnetic Transparent Fraction-Tiles & Fraction-Towers", "commission": "Courtyard Shadow Fraction Map: Measure shadow lengths at solar noon, generate equivalent fraction ratios on number lines.", "production": {"A": "Compare + one-line why", "B": "AI critic on his comparison"}, "deck": null}, {"code": "8-7", "title": "Construct Arguments (p. 317) — as time allows", "semester": 1, "topic": 8, "topicTitle": "Extend Understanding of Fraction Equivalence and Ordering", "week": 16, "optional": true, "path": "../semester1/lessons/8-7-construct-arguments-p-317-as-time-allows.md", "objective": "construct math arguments using what I know about fractions.", "place": "Sahn al-Zill · construct, don’t shout", "rifqah": "al-Najm", "hook": "*An argument is a trust.*", "setting": "Convince, don’t shout", "task": "Construct argument", "twin": "Magnetic Transparent Fraction-Tiles & Fraction-Towers", "commission": "Courtyard Shadow Fraction Map: Measure shadow lengths at solar noon, generate equivalent fraction ratios on number lines.", "production": {"A": "Two sentences of why", "B": "Argument poster: evidence not volume"}, "deck": null}, {"code": "8-1", "title": "Equivalent Fractions: Area Models (p. 293)", "semester": 2, "topic": 8, "topicTitle": "Extend Understanding of Fraction Equivalence and Ordering", "week": 1, "optional": false, "path": "../semester2/lessons/8-1-equivalent-fractions-area-models-p-293.md", "objective": "+ one Visual Learning example. 3–5 min / 1 page. |", "place": "Sahn al-Zill · Courtyard of Shade", "rifqah": "al-Najm", "hook": "*Same floor, two names. Area models.*", "setting": "Tile the shade · area", "task": "Same amount, cut finer", "twin": "Magnetic Transparent Fraction-Tiles & Fraction-Towers", "commission": "Courtyard Shadow Fraction Map: Measure shadow lengths at solar noon, generate equivalent fraction ratios on number lines.", "production": {"A": "Two area models, one amount", "B": "Tile drawing of the courtyard"}, "deck": null}, {"code": "8-2", "title": "Equivalent Fractions: Number Lines (p. 297)", "semester": 2, "topic": 8, "topicTitle": "Extend Understanding of Fraction Equivalence and Ordering", "week": 1, "optional": false, "path": "../semester2/lessons/8-2-equivalent-fractions-number-lines-p-297.md", "objective": "+ one Visual Learning example. 3–5 min / 1 page. |", "place": "Sahn al-Zill · the same place on the line", "rifqah": "al-Najm", "hook": "*Two fractions, one point.*", "setting": "Same place on the courtyard line", "task": "Two fractions, one point", "twin": "Magnetic Transparent Fraction-Tiles & Fraction-Towers", "commission": "Courtyard Shadow Fraction Map: Measure shadow lengths at solar noon, generate equivalent fraction ratios on number lines.", "production": {"A": "Number line with two names", "B": "Four-line same-place chant"}, "deck": null}, {"code": "8-3", "title": "Generate Equivalent Fractions: Multiplication (p. 301)", "semester": 2, "topic": 8, "topicTitle": "Extend Understanding of Fraction Equivalence and Ordering", "week": 1, "optional": false, "path": "../semester2/lessons/8-3-generate-equivalent-fractions-multiplication-p-301.md", "objective": "+ one Visual Learning example. 3–5 min / 1 page. |", "place": "Sahn al-Zill · grow the name, not the amount", "rifqah": "al-Najm", "hook": "*Multiply to equivalent. The shade does not grow.*", "setting": "Grow the name, not the amount", "task": "× same number top and bottom", "twin": "Magnetic Transparent Fraction-Tiles & Fraction-Towers", "commission": "Courtyard Shadow Fraction Map: Measure shadow lengths at solar noon, generate equivalent fraction ratios on number lines.", "production": {"A": "× card", "B": "Poster: grow the name, not the amount"}, "deck": null}, {"code": "8-4", "title": "Generate Equivalent Fractions: Division (p. 305)", "semester": 2, "topic": 8, "topicTitle": "Extend Understanding of Fraction Equivalence and Ordering", "week": 16, "optional": false, "path": "../semester2/lessons/8-4-generate-equivalent-fractions-division-p-305.md", "objective": "use division to find equivalent fractions.", "place": "Sahn al-Zill · shrink the name, not the amount", "rifqah": "al-Najm", "hook": "*Divide to equivalent.*", "setting": "Shrink the name, not the amount", "task": "÷ same", "twin": "Magnetic Transparent Fraction-Tiles & Fraction-Towers", "commission": "Courtyard Shadow Fraction Map: Measure shadow lengths at solar noon, generate equivalent fraction ratios on number lines.", "production": {"A": "÷ card", "B": "Mind map: × and ÷, same floor"}, "deck": null}, {"code": "8-5", "title": "Use Benchmarks to Compare Fractions (p. 309)", "semester": 2, "topic": 8, "topicTitle": "Extend Understanding of Fraction Equivalence and Ordering", "week": 16, "optional": false, "path": "../semester2/lessons/8-5-use-benchmarks-to-compare-fractions-p-309.md", "objective": "use benchmarks, area models, and number lines to compare fractions.", "place": "Sahn al-Zill · three lamps", "rifqah": "al-Najm", "hook": "*Benchmarks 0, ½, 1.*", "setting": "Three lamps: 0, ½, 1", "task": "Benchmark", "twin": "Magnetic Transparent Fraction-Tiles & Fraction-Towers", "commission": "Courtyard Shadow Fraction Map: Measure shadow lengths at solar noon, generate equivalent fraction ratios on number lines.", "production": {"A": "Benchmark card with his fraction", "B": "Three-lamp drawing"}, "deck": null}, {"code": "8-6", "title": "Compare Fractions (p. 313)", "semester": 2, "topic": 8, "topicTitle": "Extend Understanding of Fraction Equivalence and Ordering", "week": 16, "optional": false, "path": "../semester2/lessons/8-6-compare-fractions-p-313.md", "objective": "use equivalent fractions to compare fractions.", "place": "Sahn al-Zill · same shade or not?", "rifqah": "al-Najm", "hook": "*Compare. Evidence, not volume.*", "setting": "Same shade or not?", "task": "Compare with a why", "twin": "Magnetic Transparent Fraction-Tiles & Fraction-Towers", "commission": "Courtyard Shadow Fraction Map: Measure shadow lengths at solar noon, generate equivalent fraction ratios on number lines.", "production": {"A": "Compare + one-line why", "B": "AI critic on his comparison"}, "deck": null}, {"code": "8-7", "title": "Construct Arguments (p. 317) — as time allows", "semester": 2, "topic": 8, "topicTitle": "Extend Understanding of Fraction Equivalence and Ordering", "week": 16, "optional": true, "path": "../semester2/lessons/8-7-construct-arguments-p-317-as-time-allows.md", "objective": "construct math arguments using what I know about fractions.", "place": "Sahn al-Zill · construct, don’t shout", "rifqah": "al-Najm", "hook": "*An argument is a trust.*", "setting": "Convince, don’t shout", "task": "Construct argument", "twin": "Magnetic Transparent Fraction-Tiles & Fraction-Towers", "commission": "Courtyard Shadow Fraction Map: Measure shadow lengths at solar noon, generate equivalent fraction ratios on number lines.", "production": {"A": "Two sentences of why", "B": "Argument poster: evidence not volume"}, "deck": null}, {"code": "9-1", "title": "Model Addition of Fractions (p. 333)", "semester": 2, "topic": 9, "topicTitle": "Understand Addition and Subtraction of Fractions", "week": 3, "optional": false, "path": "../semester2/lessons/9-1-model-addition-of-fractions-p-333.md", "objective": "use tools such as fraction strips or area models to add fractions.", "place": "Suffat al-Iftar · Sharing Ledge (fictional feast, not fiqh)", "rifqah": "al-Bi’r", "hook": "*Join two parts of the same tray.*", "setting": "Join two parts of the same tray · Amma", "task": "Model addition, like denominators", "twin": "Segmented Food Sharing Platters & Colored Magnetic Fraction Rings", "commission": "Iftar Share Platters: Decompose flatbreads, add mixed number portions, and subtract rations for the valley journey.", "production": {"A": "Joined tray model", "B": "Tray drawing before/after"}, "deck": null}, {"code": "9-2", "title": "Decompose Fractions (p. 337)", "semester": 2, "topic": 9, "topicTitle": "Understand Addition and Subtraction of Fractions", "week": 3, "optional": false, "path": "../semester2/lessons/9-2-decompose-fractions-p-337.md", "objective": "use number lines, area models, or drawings to decompose fractions.", "place": "Suffat al-Iftar · one cake, many ways", "rifqah": "al-Bi’r", "hook": "*Decompose. Pieces must rejoin.*", "setting": "One cake, many cuts", "task": "Decompose; pieces must rejoin", "twin": "Segmented Food Sharing Platters & Colored Magnetic Fraction Rings", "commission": "Iftar Share Platters: Decompose flatbreads, add mixed number portions, and subtract rations for the valley journey.", "production": {"A": "Decomposition written", "B": "Cake sketch: one whole, many cuts"}, "deck": null}, {"code": "9-3", "title": "Add Fractions with Like Denominators (p. 341)", "semester": 2, "topic": 9, "topicTitle": "Understand Addition and Subtraction of Fractions", "week": 3, "optional": false, "path": "../semester2/lessons/9-3-add-fractions-with-like-denominators-p-341.md", "objective": "use joining parts of the same whole to add fractions with like denominators.", "place": "Suffat al-Iftar · like denominators", "rifqah": "al-Bi’r", "hook": "*Add. Do not add the denominators.*", "setting": "Add like · don’t add denominators", "task": "Sum", "twin": "Segmented Food Sharing Platters & Colored Magnetic Fraction Rings", "commission": "Iftar Share Platters: Decompose flatbreads, add mixed number portions, and subtract rations for the valley journey.", "production": {"A": "Sum slip", "B": "Chant: add the parts, keep the name of the part"}, "deck": null}, {"code": "9-4", "title": "Model Subtraction (optional bridge, p. 345)", "semester": 2, "topic": 9, "topicTitle": "Understand Addition and Subtraction of Fractions", "week": 4, "optional": false, "path": "../semester2/lessons/9-4-model-subtraction.md", "objective": "Master concepts for Door 9-4", "place": "Suffat al-Iftar · optional bridge", "rifqah": "al-Bi’r", "hook": "*Model taking away from the same tray. A piece from the wrong tray is Ghubar.*", "setting": "Take from the right tray", "task": "Model subtraction", "twin": "Segmented Food Sharing Platters & Colored Magnetic Fraction Rings", "commission": "Iftar Share Platters: Decompose flatbreads, add mixed number portions, and subtract rations for the valley journey.", "production": {"A": "Take-away model", "B": "Comic: the right tray only"}, "deck": null}, {"code": "9-5", "title": "Subtract Fractions with Like Denominators (p. 349)", "semester": 2, "topic": 9, "topicTitle": "Understand Addition and Subtraction of Fractions", "week": 4, "optional": false, "path": "../semester2/lessons/9-5-subtract-fractions-with-like-denominators-p-349.md", "objective": "use subtraction as separating parts of the same whole.", "place": "Suffat al-Iftar · subtract like", "rifqah": "al-Bi’r", "hook": "*Same ledge. Honest take-away.*", "setting": "Subtract like", "task": "Difference", "twin": "Segmented Food Sharing Platters & Colored Magnetic Fraction Rings", "commission": "Iftar Share Platters: Decompose flatbreads, add mixed number portions, and subtract rations for the valley journey.", "production": {"A": "Difference slip", "B": "Mind map: join vs take"}, "deck": null}, {"code": "9-6", "title": "Add and Subtract Fractions with Like Denominators (p. 353)", "semester": 2, "topic": 9, "topicTitle": "Understand Addition and Subtraction of Fractions", "week": 4, "optional": false, "path": "../semester2/lessons/9-6-add-and-subtract-fractions-with-like-denominators-p-353.md", "objective": "use a number line to add and subtract fractions that refer to the same whole.", "place": "Suffat al-Iftar · both operations", "rifqah": "al-Bi’r", "hook": "*Add or subtract? Justify the sign.*", "setting": "Same ledge, + or −", "task": "Justify the sign", "twin": "Segmented Food Sharing Platters & Colored Magnetic Fraction Rings", "commission": "Iftar Share Platters: Decompose flatbreads, add mixed number portions, and subtract rations for the valley journey.", "production": {"A": "Sign justified", "B": "Two-door poster: add / subtract"}, "deck": null}, {"code": "9-7", "title": "Model Addition and Subtraction of Mixed Numbers (p. 357)", "semester": 2, "topic": 9, "topicTitle": "Understand Addition and Subtraction of Fractions", "week": 4, "optional": false, "path": "../semester2/lessons/9-7-model-addition-and-subtraction-of-mixed-numbers-p-357.md", "objective": "use models and equivalent fractions to add and subtract mixed numbers.", "place": "Suffat al-Iftar · whole cakes and slices", "rifqah": "al-Bi’r", "hook": "*Mixed numbers. Do not ignore the wholes.*", "setting": "Whole cakes and slices", "task": "Mixed as a sum", "twin": "Segmented Food Sharing Platters & Colored Magnetic Fraction Rings", "commission": "Iftar Share Platters: Decompose flatbreads, add mixed number portions, and subtract rations for the valley journey.", "production": {"A": "Mixed model", "B": "Whole-and-slice drawing"}, "deck": null}, {"code": "9-8", "title": "Add Mixed Numbers (p. 361)", "semester": 2, "topic": 9, "topicTitle": "Understand Addition and Subtraction of Fractions", "week": 5, "optional": false, "path": "../semester2/lessons/9-8-add-mixed-numbers-p-361.md", "objective": "use equivalent fractions and properties of operations to add mixed numbers with like denominators.", "place": "Suffat al-Iftar · add mixed", "rifqah": "al-Bi’r", "hook": "*Overflow of slices becomes another whole.*", "setting": "Add mixed · overflow becomes a whole", "task": "Regroup the extra whole", "twin": "Segmented Food Sharing Platters & Colored Magnetic Fraction Rings", "commission": "Iftar Share Platters: Decompose flatbreads, add mixed number portions, and subtract rations for the valley journey.", "production": {"A": "Regroup shown", "B": "AI critic on the overflow"}, "deck": null}, {"code": "9-9", "title": "Subtract Mixed Numbers (p. 365)", "semester": 2, "topic": 9, "topicTitle": "Understand Addition and Subtraction of Fractions", "week": 5, "optional": false, "path": "../semester2/lessons/9-9-subtract-mixed-numbers-p-365.md", "objective": "use equivalent fractions, properties, and the inverse of addition to subtract mixed numbers.", "place": "Suffat al-Iftar · subtract mixed", "rifqah": "al-Bi’r", "hook": "*Borrow from the whole if you must.*", "setting": "Subtract mixed · borrow from the whole", "task": "The borrow shown", "twin": "Segmented Food Sharing Platters & Colored Magnetic Fraction Rings", "commission": "Iftar Share Platters: Decompose flatbreads, add mixed number portions, and subtract rations for the valley journey.", "production": {"A": "Borrow shown", "B": "Poster: the borrow is a trade"}, "deck": null}, {"code": "9-10", "title": "Model with Math (as time allows, p. 369)", "semester": 2, "topic": 9, "topicTitle": "Understand Addition and Subtraction of Fractions", "week": 5, "optional": true, "path": "../semester2/lessons/9-10-model-with-math-as-time-allows-p-369.md", "objective": "+ one Visual Learning example. 3–5 min / 1 page. |", "place": "Suffat al-Iftar · model with math", "rifqah": "al-Bi’r", "hook": "*If time. Pretty picture is not enough.*", "setting": "Model = equation", "task": "Picture that is math", "twin": "Segmented Food Sharing Platters & Colored Magnetic Fraction Rings", "commission": "Iftar Share Platters: Decompose flatbreads, add mixed number portions, and subtract rations for the valley journey.", "production": {"A": "Model = equation", "B": "One picture, one equation, same paper"}, "deck": null}, {"code": "10-1", "title": "Fractions as Multiples of Unit Fractions (p. 385)", "semester": 2, "topic": 10, "topicTitle": "Extend Multiplication Concepts to Fractions", "week": 5, "optional": false, "path": "../semester2/lessons/10-1-fractions-as-multiples-of-unit-fractions-p-385.md", "objective": "use fraction strips or number lines to understand a fraction as a multiple of a unit fraction.", "place": "Qirbat al-Juz’ · Water-Skin of Parts", "rifqah": "al-Nakhl", "hook": "*A fraction as copies of a unit fraction. 3/8 is not 3.*", "setting": "Skin marked in eighths", "task": "3/8 is three copies of 1/8", "twin": "Calibrated Water Skins & Unit Fraction Fill Cups", "commission": "Stopwatch Time Trial & Rations: Multiply unit fractions of water per caravan trek hour and solve elapsed time trials.", "production": {"A": "Unit iterated", "B": "Skin drawing in eighths, three filled"}, "deck": null}, {"code": "10-2", "title": "Multiply a Fraction by a Whole Number: Use Models (p. 389)", "semester": 2, "topic": 10, "topicTitle": "Extend Multiplication Concepts to Fractions", "week": 6, "optional": false, "path": "../semester2/lessons/10-2-multiply-a-fraction-by-a-whole-number-use-models-p-389.md", "objective": "use drawings, area models, or number lines to multiply fractions by whole numbers.", "place": "Qirbat al-Juz’ · how many cups", "rifqah": "al-Nakhl", "hook": "*Models: ⅓ cup? ¾ cup?*", "setting": "How many ⅓ cups?", "task": "Model × whole", "twin": "Calibrated Water Skins & Unit Fraction Fill Cups", "commission": "Stopwatch Time Trial & Rations: Multiply unit fractions of water per caravan trek hour and solve elapsed time trials.", "production": {"A": "Cup model", "B": "Mind map: copies of a unit"}, "deck": null}, {"code": "10-3", "title": "Multiply a Fraction by a Whole Number: Use Symbols (p. 393)", "semester": 2, "topic": 10, "topicTitle": "Extend Multiplication Concepts to Fractions", "week": 6, "optional": false, "path": "../semester2/lessons/10-3-multiply-a-fraction-by-a-whole-number-use-symbols-p-393.md", "objective": "use properties and equations to multiply a fraction by a whole number.", "place": "Qirbat al-Juz’ · ⅜ × 8 gallons", "rifqah": "al-Nakhl", "hook": "*Symbols. Keep the unit.*", "setting": "⅜ × 8 gallons", "task": "Equation with unit", "twin": "Calibrated Water Skins & Unit Fraction Fill Cups", "commission": "Stopwatch Time Trial & Rations: Multiply unit fractions of water per caravan trek hour and solve elapsed time trials.", "production": {"A": "Equation + unit", "B": "Chant: keep the unit"}, "deck": null}, {"code": "10-4", "title": "Solve Time Problems (p. 397)", "semester": 2, "topic": 10, "topicTitle": "Extend Multiplication Concepts to Fractions", "week": 6, "optional": false, "path": "../semester2/lessons/10-4-solve-time-problems-p-397.md", "objective": "use addition, subtraction, multiplication, or division to solve problems involving time.", "place": "Qirbat al-Juz’ · time is a skin too", "rifqah": "al-Nakhl", "hook": "*2 h 50 min vs 3 h 58 min. Minutes are not base-10 until you regroup.*", "setting": "Travel · Haramain gate · Abu", "task": "Elapsed time; minutes regroup", "twin": "Calibrated Water Skins & Unit Fraction Fill Cups", "commission": "Stopwatch Time Trial & Rations: Multiply unit fractions of water per caravan trek hour and solve elapsed time trials.", "production": {"A": "Boarding pass: departure · duration · arrival", "B": "Two clock faces, elapsed as an arc"}, "deck": null}, {"code": "10-5", "title": "Model with Math (as time allows, p. 401)", "semester": 2, "topic": 10, "topicTitle": "Extend Multiplication Concepts to Fractions", "week": 6, "optional": true, "path": "../semester2/lessons/10-5-model-with-math-as-time-allows-p-401.md", "objective": "+ one Visual Learning example. 3–5 min / 1 page. |", "place": "Qirbat al-Juz’ · model (if time)", "rifqah": "al-Nakhl", "hook": "*Model with math.*", "setting": "Model with math", "task": "Signed model", "twin": "Calibrated Water Skins & Unit Fraction Fill Cups", "commission": "Stopwatch Time Trial & Rations: Multiply unit fractions of water per caravan trek hour and solve elapsed time trials.", "production": {"A": "Signed model", "B": "AI critic on the model"}, "deck": null}, {"code": "11-1", "title": "Read Line Plots (p. 417)", "semester": 2, "topic": 11, "topicTitle": "Represent and Interpret Data on Line Plots", "week": 7, "optional": false, "path": "../semester2/lessons/11-1-read-line-plots-p-417.md", "objective": "interpret data using line plots.", "place": "Darb al-Athar · the Track", "rifqah": "al-Najm", "hook": "*Read the prints. Longest? Shortest? Labels are a trust.*", "setting": "Emad’s 12 fish on the Corniche", "task": "Read longest/shortest with units", "twin": "Wooden Measuring Rulers & Peg Line Plot Pegboard", "commission": "Hand Span Line Plot Study: Measure student palm spans in fractional eighth-inches, construct line plots, and analyze spreads.", "production": {"A": "Plot read, units on it", "B": "Two lines: why a missing label lies"}, "deck": null}, {"code": "11-2", "title": "Make Line Plots (p. 421)", "semester": 2, "topic": 11, "topicTitle": "Represent and Interpret Data on Line Plots", "week": 7, "optional": false, "path": "../semester2/lessons/11-2-make-line-plots-p-421.md", "objective": "make a line plot to represent data.", "place": "Darb al-Athar · make the track", "rifqah": "al-Najm", "hook": "*What sold most? Do not invent the scale.*", "setting": "Shoe stall · what sold most", "task": "Make the plot; don’t invent the scale", "twin": "Wooden Measuring Rulers & Peg Line Plot Pegboard", "commission": "Hand Span Line Plot Study: Measure student palm spans in fractional eighth-inches, construct line plots, and analyze spreads.", "production": {"A": "Plot built", "B": "Stall poster from HIS plot"}, "deck": null}, {"code": "11-3", "title": "Use Line Plots to Solve Problems (p. 425)", "semester": 2, "topic": 11, "topicTitle": "Represent and Interpret Data on Line Plots", "week": 7, "optional": false, "path": "../semester2/lessons/11-3-use-line-plots-to-solve-problems-p-425.md", "objective": "use line plots to solve problems involving fractions.", "place": "Darb al-Athar · longest minus shortest", "rifqah": "al-Najm", "hook": "*The number, not the pile of X’s.*", "setting": "10 caterpillars", "task": "Longest − shortest from values, not X-count", "twin": "Wooden Measuring Rulers & Peg Line Plot Pegboard", "commission": "Hand Span Line Plot Study: Measure student palm spans in fractional eighth-inches, construct line plots, and analyze spreads.", "production": {"A": "Equation from the plot", "B": "Comic: Nader counts dots; Omar reads lengths"}, "deck": null}, {"code": "11-4", "title": "Critique Reasoning (p. 429)", "semester": 2, "topic": 11, "topicTitle": "Represent and Interpret Data on Line Plots", "week": 8, "optional": false, "path": "../semester2/lessons/11-4-critique-reasoning-p-429.md", "objective": "use what I know about line plots to critique the reasoning of others.", "place": "Darb al-Athar · four dots is not 4 inches", "rifqah": "al-Najm", "hook": "*Critique Nader. Kindness without math is not enough.*", "setting": "Nader’s snowfall", "task": "Four dots is not 4 inches", "twin": "Wooden Measuring Rulers & Peg Line Plot Pegboard", "commission": "Hand Span Line Plot Study: Measure student palm spans in fractional eighth-inches, construct line plots, and analyze spreads.", "production": {"A": "Two-line critique", "B": "AI critic: kind AND mathematical?"}, "deck": null}, {"code": "12-1", "title": "Fractions and Decimals (p. 445)", "semester": 2, "topic": 12, "topicTitle": "Understand and Compare Decimals", "week": 8, "optional": false, "path": "../semester2/lessons/12-1-fractions-and-decimals-p-445.md", "objective": "relate fractions and decimals.", "place": "Dakkan al-Halalah · Honest Coin", "rifqah": "al-Misbah", "hook": "*7 of 10. Fraction and decimal, same stall.*", "setting": "7 of 10 at the stall", "task": "7/10 and 0.7, not 7.10", "twin": "Hundredth Grid Slates & Decimal Currency Coins (SAR & Halalah)", "commission": "Souq Cashier Register: Convert fractions with tenths/hundredths to decimal currency and compare ledger values.", "production": {"A": "Coin card both forms", "B": "Stall drawing: 10 stalls, 7 marked"}, "deck": null}, {"code": "12-2", "title": "Fractions and Decimals on the Number Line (p. 449)", "semester": 2, "topic": 12, "topicTitle": "Understand and Compare Decimals", "week": 8, "optional": false, "path": "../semester2/lessons/12-2-fractions-and-decimals-on-the-number-line-p-449.md", "objective": "locate and describe fractions and decimals on number lines.", "place": "Dakkan al-Halalah · the stall’s ruler", "rifqah": "al-Misbah", "hook": "*Name the lettered points.*", "setting": "Stall ruler", "task": "Name the lettered point", "twin": "Hundredth Grid Slates & Decimal Currency Coins (SAR & Halalah)", "commission": "Souq Cashier Register: Convert fractions with tenths/hundredths to decimal currency and compare ledger values.", "production": {"A": "Point named", "B": "Number-line poster"}, "deck": null}, {"code": "12-3", "title": "Compare Decimals (p. 453)", "semester": 2, "topic": 12, "topicTitle": "Understand and Compare Decimals", "week": 9, "optional": false, "path": "../semester2/lessons/12-3-compare-decimals-p-453.md", "objective": "compare decimals by reasoning about their size.", "place": "Dakkan al-Halalah · 0.11 or 0.09", "rifqah": "al-Misbah", "hook": "*Which halalah is heavier? 9 is not bigger than 11 here.*", "setting": "Which halalah is heavier — 0.11 or 0.09?", "task": "Place value, not 9>11", "twin": "Hundredth Grid Slates & Decimal Currency Coins (SAR & Halalah)", "commission": "Souq Cashier Register: Convert fractions with tenths/hundredths to decimal currency and compare ledger values.", "production": {"A": "Compare card", "B": "Chant: tenths then hundredths"}, "deck": null}, {"code": "12-4", "title": "Add Fractions with Denominators of 10 and 100 (p. 457)", "semester": 2, "topic": 12, "topicTitle": "Understand and Compare Decimals", "week": 9, "optional": false, "path": "../semester2/lessons/12-4-add-fractions-with-denominators-of-10-and-100-p-457.md", "objective": "use equivalence to add fractions with denominators of 10 and 100.", "place": "Dakkan al-Halalah · mural in 100 parts", "rifqah": "al-Misbah", "hook": "*4/10 + 5/100. Common hundredths.*", "setting": "Mural in 100 tiles", "task": "4/10 + 5/100 common hundredths", "twin": "Hundredth Grid Slates & Decimal Currency Coins (SAR & Halalah)", "commission": "Souq Cashier Register: Convert fractions with tenths/hundredths to decimal currency and compare ledger values.", "production": {"A": "Hundredths sum", "B": "10×10 mural sketch"}, "deck": null}, {"code": "12-5", "title": "Solve Word Problems Involving Money (p. 461)", "semester": 2, "topic": 12, "topicTitle": "Understand and Compare Decimals", "week": 9, "optional": false, "path": "../semester2/lessons/12-5-solve-word-problems-involving-money-p-461.md", "objective": "use fractions or decimals to solve word problems involving money.", "place": "Dakkan al-Halalah · SAR 24 × 3, pay 80", "rifqah": "al-Misbah", "hook": "*Change is a trust.*", "setting": "Flash drive SAR 24×3, pay 80 · Amm", "task": "Change; no invented tax", "twin": "Hundredth Grid Slates & Decimal Currency Coins (SAR & Halalah)", "commission": "Souq Cashier Register: Convert fractions with tenths/hundredths to decimal currency and compare ledger values.", "production": {"A": "Change slip", "B": "Receipt drawing for Amm"}, "deck": null}, {"code": "12-6", "title": "Look For and Use Structure (p. 465)", "semester": 2, "topic": 12, "topicTitle": "Understand and Compare Decimals", "week": 10, "optional": false, "path": "../semester2/lessons/12-6-look-for-and-use-structure-p-465.md", "objective": "use the structure of the place-value system to solve problems.", "place": "Dakkan al-Halalah · where is 1 mile?", "rifqah": "al-Misbah", "hook": "*0.25, 0.5, 0.75. Align the marks.*", "setting": "Three hikers 0.25, 0.5, 0.75 of a mile", "task": "Where is 1?", "twin": "Hundredth Grid Slates & Decimal Currency Coins (SAR & Halalah)", "commission": "Souq Cashier Register: Convert fractions with tenths/hundredths to decimal currency and compare ledger values.", "production": {"A": "1-mile mark aligned", "B": "Hiker poster: three boys, one mile"}, "deck": null}, {"code": "13-1", "title": "Equivalence with Customary Units of Length (p. 481)", "semester": 2, "topic": 13, "topicTitle": "Measurement: Find Equivalence in Units of Measure", "week": 10, "optional": false, "path": "../semester2/lessons/13-1-equivalence-with-customary-units-of-length-p-481.md", "objective": "convert customary units of length and recognize relative size.", "place": "Mizan al-Dhira’ · House of the Cubit", "rifqah": "al-Najm", "hook": "*75 yards to school. How many feet? 3 feet = 1 yard.*", "setting": "Jawad 75 yards to school", "task": "75 × 3 = 225 ft", "twin": "Trundle Wheel, Yardstick & Metric Caliper Kit", "commission": "School Perimeter & Area Survey: Measure classroom and courtyard dimensions in metric and customary units.", "production": {"A": "Route card in feet", "B": "School-path sketch yards and feet"}, "deck": null}, {"code": "13-2", "title": "Equivalence with Customary Units of Capacity (p. 485)", "semester": 2, "topic": 13, "topicTitle": "Measurement: Find Equivalence in Units of Measure", "week": 10, "optional": false, "path": "../semester2/lessons/13-2-equivalence-with-customary-units-of-capacity-p-485.md", "objective": "convert customary units of capacity and recognize relative size.", "place": "Mizan al-Dhira’ · half a gallon", "rifqah": "al-Najm", "hook": "*How many pints?*", "setting": "Karim’s juice · ½ gallon", "task": "Pint is not a cup", "twin": "Trundle Wheel, Yardstick & Metric Caliper Kit", "commission": "School Perimeter & Area Survey: Measure classroom and courtyard dimensions in metric and customary units.", "production": {"A": "Conversion", "B": "Jug drawing with pints marked"}, "deck": null}, {"code": "13-3", "title": "Equivalence with Customary Units of Weight (p. 489)", "semester": 2, "topic": 13, "topicTitle": "Measurement: Find Equivalence in Units of Measure", "week": 11, "optional": false, "path": "../semester2/lessons/13-3-equivalence-with-customary-units-of-weight-p-489.md", "objective": "convert customary units of weight and recognize relative size.", "place": "Mizan al-Dhira’ · puppy Badr", "rifqah": "al-Najm", "hook": "*½ pound in ounces. 16, not 8.*", "setting": "Puppy Badr · ½ pound", "task": "×16 ounces, not 8", "twin": "Trundle Wheel, Yardstick & Metric Caliper Kit", "commission": "School Perimeter & Area Survey: Measure classroom and courtyard dimensions in metric and customary units.", "production": {"A": "Vet card", "B": "Puppy poster with the scale"}, "deck": null}, {"code": "13-4", "title": "Equivalence with Metric Units of Length (p. 493)", "semester": 2, "topic": 13, "topicTitle": "Measurement: Find Equivalence in Units of Measure", "week": 11, "optional": false, "path": "../semester2/lessons/13-4-equivalence-with-metric-units-of-length-p-493.md", "objective": "convert metric units of length and recognize relative size.", "place": "Mizan al-Dhira’ · a marker", "rifqah": "al-Najm", "hook": "*cm and mm. ×10.*", "setting": "Marker in cm and mm", "task": "×10", "twin": "Trundle Wheel, Yardstick & Metric Caliper Kit", "commission": "School Perimeter & Area Survey: Measure classroom and courtyard dimensions in metric and customary units.", "production": {"A": "Lab strip", "B": "Marker drawing dual-labelled"}, "deck": null}, {"code": "13-5", "title": "Equivalence with Metric Units of Capacity and Mass (p. 497)", "semester": 2, "topic": 13, "topicTitle": "Measurement: Find Equivalence in Units of Measure", "week": 11, "optional": false, "path": "../semester2/lessons/13-5-equivalence-with-metric-units-of-capacity-and-mass-p-497.md", "objective": "convert metric units of capacity and mass and recognize relative size.", "place": "Mizan al-Dhira’ · 3 L of water", "rifqah": "al-Najm", "hook": "*mL and grams. 1 L of water is 1 kg.*", "setting": "Jad 3 L of water", "task": "3 000 mL and 3 000 g", "twin": "Trundle Wheel, Yardstick & Metric Caliper Kit", "commission": "School Perimeter & Area Survey: Measure classroom and courtyard dimensions in metric and customary units.", "production": {"A": "Skin label", "B": "Mind map: capacity and mass of water"}, "deck": null}, {"code": "13-6", "title": "Solve Perimeter and Area Problems (p. 501)", "semester": 2, "topic": 13, "topicTitle": "Measurement: Find Equivalence in Units of Measure", "week": 12, "optional": false, "path": "../semester2/lessons/13-6-solve-perimeter-and-area-problems-p-501.md", "objective": "find the unknown length or width of a rectangle using a known area or perimeter.", "place": "Mizan al-Dhira’ · 168 sq ft wall", "rifqah": "al-Najm", "hook": "*8 ft high. Width? Tape? Area is not perimeter.*", "setting": "Wall 168 sq ft, 8 ft high", "task": "Width from area; tape is perimeter", "twin": "Trundle Wheel, Yardstick & Metric Caliper Kit", "commission": "School Perimeter & Area Survey: Measure classroom and courtyard dimensions in metric and customary units.", "production": {"A": "Paint order + tape length", "B": "Wall drawing: area gold, perimeter teal"}, "deck": null}, {"code": "13-7", "title": "Precision (as time allows, p. 505)", "semester": 2, "topic": 13, "topicTitle": "Measurement: Find Equivalence in Units of Measure", "week": 12, "optional": true, "path": "../semester2/lessons/13-7-precision-as-time-allows-p-505.md", "objective": "+ one Visual Learning example. 3–5 min / 1 page. |", "place": "Mizan al-Dhira’ · precision", "rifqah": "al-Najm", "hook": "*The right unit is amanah.*", "setting": "The right unit is amanah", "task": "Justify the unit", "twin": "Trundle Wheel, Yardstick & Metric Caliper Kit", "commission": "School Perimeter & Area Survey: Measure classroom and courtyard dimensions in metric and customary units.", "production": {"A": "Unit justified", "B": "AI critic: honest unit?"}, "deck": null}, {"code": "14-1", "title": "Number Sequences (p. 521)", "semester": 2, "topic": 14, "topicTitle": "Algebra: Generate and Analyze Patterns", "week": 12, "optional": false, "path": "../semester2/lessons/14-1-number-sequences-p-521.md", "objective": "use a rule to create and extend a number pattern and identify features not described by the rule.", "place": "Silsilat al-Najm · Chain of Stars", "rifqah": "al-Najm", "hook": "*Start 18, add 3. Even? Odd? Name the feature.*", "setting": "Start 18, add 3", "task": "Next six + even/odd", "twin": "Geometric Mosaic Pattern Blocks & Number Sequence Strips", "commission": "Star Band Repeating Mosaic: Design geometric mosaic borders using algebraic number rules and repeating shapes.", "production": {"A": "Sequence strip", "B": "Star-ridge drawing of the next six"}, "deck": null}, {"code": "14-2", "title": "Patterns: Number Rules (p. 525)", "semester": 2, "topic": 14, "topicTitle": "Algebra: Generate and Analyze Patterns", "week": 12, "optional": false, "path": "../semester2/lessons/14-2-patterns-number-rules-p-525.md", "objective": "use a rule to extend a number pattern, identify features, and use the pattern to solve a problem.", "place": "Silsilat al-Najm · juice packs", "rifqah": "al-Najm", "hook": "*6, 12, 18… 10 packs? 100? The rule is ×6.*", "setting": "Juice packs 6, 12, 18…", "task": "10 packs? 100? Rule ×6", "twin": "Geometric Mosaic Pattern Blocks & Number Sequence Strips", "commission": "Star Band Repeating Mosaic: Design geometric mosaic borders using algebraic number rules and repeating shapes.", "production": {"A": "Rule card", "B": "Juice-pack poster"}, "deck": null}, {"code": "14-3", "title": "Patterns: Repeating Shapes (p. 529)", "semester": 2, "topic": 14, "topicTitle": "Algebra: Generate and Analyze Patterns", "week": 13, "optional": false, "path": "../semester2/lessons/14-3-patterns-repeating-shapes-p-529.md", "objective": "use a rule to predict a number or shape in a pattern.", "place": "Silsilat al-Najm · square, triangle", "rifqah": "al-Najm", "hook": "*What is the 37th? Ghubar says whatever looks pretty.*", "setting": "Square, triangle… 37th?", "task": "Count from 1", "twin": "Geometric Mosaic Pattern Blocks & Number Sequence Strips", "commission": "Star Band Repeating Mosaic: Design geometric mosaic borders using algebraic number rules and repeating shapes.", "production": {"A": "37th named", "B": "Repeating-tile drawing then leap to 37"}, "deck": null}, {"code": "14-4", "title": "Look For and Use Structure (as time allows, p. 533)", "semester": 2, "topic": 14, "topicTitle": "Algebra: Generate and Analyze Patterns", "week": 13, "optional": true, "path": "../semester2/lessons/14-4-look-for-and-use-structure-as-time-allows-p-533.md", "objective": "+ one Visual Learning example. 3–5 min / 1 page. |", "place": "Silsilat al-Najm · structure", "rifqah": "al-Najm", "hook": "*If time. Find the hidden repeat.*", "setting": "The hidden repeat", "task": "Structure", "twin": "Geometric Mosaic Pattern Blocks & Number Sequence Strips", "commission": "Star Band Repeating Mosaic: Design geometric mosaic borders using algebraic number rules and repeating shapes.", "production": {"A": "Hidden repeat named", "B": "Mind map: what repeats, what grows"}, "deck": null}, {"code": "15-1", "title": "Lines, Rays, and Angles (p. 549)", "semester": 2, "topic": 15, "topicTitle": "Geometric Measurement: Understand Concepts of Angles and Angle Measurement", "week": 13, "optional": false, "path": "../semester2/lessons/15-1-lines-rays-and-angles-p-549.md", "objective": "recognize and draw lines, rays, and different types of angles.", "place": "al-Mizwala · Sundial", "rifqah": "al-Najm", "hook": "*Find a square corner. Draw two that open less.*", "setting": "Square corner of the court", "task": "Find a right angle; draw two less", "twin": "Brass 360° Rotating Protractors & Gnomon Shadow Pins", "commission": "Courtyard Sundial Build: Measure solar ray angles with protractors, calculate additive angles, and calibrate shadow marks.", "production": {"A": "Two acute drawn", "B": "Court sketch with one right angle gold"}, "deck": null}, {"code": "15-2", "title": "Understand Angles and Unit Angles (p. 553)", "semester": 2, "topic": 15, "topicTitle": "Geometric Measurement: Understand Concepts of Angles and Angle Measurement", "week": 13, "optional": false, "path": "../semester2/lessons/15-2-understand-angles-and-unit-angles-p-553.md", "objective": "use what I know about fractions to measure angles.", "place": "al-Mizwala · clock at 3", "rifqah": "al-Najm", "hook": "*The smaller angle. A quarter-turn is not ‘3’.*", "setting": "Clock at 3 · smaller angle", "task": "Quarter-turn; 90 is not 3", "twin": "Brass 360° Rotating Protractors & Gnomon Shadow Pins", "commission": "Courtyard Sundial Build: Measure solar ray angles with protractors, calculate additive angles, and calibrate shadow marks.", "production": {"A": "Quarter-turn named", "B": "Clock-face drawing"}, "deck": null}, {"code": "15-4", "title": "Measure and Draw Angles (p. 561)", "semester": 2, "topic": 15, "topicTitle": "Geometric Measurement: Understand Concepts of Angles and Angle Measurement", "week": 14, "optional": false, "path": "../semester2/lessons/15-4-measure-and-draw-angles-p-561.md", "objective": "use a protractor to measure and draw angles.", "place": "al-Mizwala · which scale?", "rifqah": "al-Najm", "hook": "*Protractor. The double number line. Name the scale.*", "setting": "Protractor · which scale?", "task": "Measure; name the scale", "twin": "Brass 360° Rotating Protractors & Gnomon Shadow Pins", "commission": "Courtyard Sundial Build: Measure solar ray angles with protractors, calculate additive angles, and calibrate shadow marks.", "production": {"A": "Measure + scale", "B": "Tool poster: inner vs outer"}, "deck": null}, {"code": "15-5", "title": "Add and Subtract Angle Measures (p. 565)", "semester": 2, "topic": 15, "topicTitle": "Geometric Measurement: Understand Concepts of Angles and Angle Measurement", "week": 14, "optional": false, "path": "../semester2/lessons/15-5-add-and-subtract-angle-measures-p-565.md", "objective": "use addition and subtraction to solve problems with unknown angle measures.", "place": "al-Mizwala · two smaller make the larger", "rifqah": "al-Najm", "hook": "*Ray BC splits the angle. Sum = whole.*", "setting": "Ray BC splits the larger", "task": "Two smaller make the whole", "twin": "Brass 360° Rotating Protractors & Gnomon Shadow Pins", "commission": "Courtyard Sundial Build: Measure solar ray angles with protractors, calculate additive angles, and calibrate shadow marks.", "production": {"A": "Sum = whole", "B": "Ray-split drawing"}, "deck": null}, {"code": "15-6", "title": "Use Appropriate Tools (as time allows, p. 569)", "semester": 2, "topic": 15, "topicTitle": "Geometric Measurement: Understand Concepts of Angles and Angle Measurement", "week": 14, "optional": true, "path": "../semester2/lessons/15-6-use-appropriate-tools-as-time-allows-p-569.md", "objective": "+ one Visual Learning example. 3–5 min / 1 page. |", "place": "al-Mizwala · tools", "rifqah": "al-Najm", "hook": "*If time. Name the tool.*", "setting": "The right tool", "task": "Name it", "twin": "Brass 360° Rotating Protractors & Gnomon Shadow Pins", "commission": "Courtyard Sundial Build: Measure solar ray angles with protractors, calculate additive angles, and calibrate shadow marks.", "production": {"A": "Tool named", "B": "AI critic: was the tool honest?"}, "deck": null}, {"code": "16-1", "title": "Lines (p. 585)", "semester": 2, "topic": 16, "topicTitle": "Lines, Angles, and Shapes", "week": 15, "optional": false, "path": "../semester2/lessons/16-1-lines-p-585.md", "objective": "draw and identify perpendicular, parallel, and intersecting lines.", "place": "Qubbat al-Thamaniya · Eight-Point Dome", "rifqah": "al-Najm", "hook": "*Never-cross / cross-once / cross-twice? Two crossings cannot be.*", "setting": "Palm rows that never meet", "task": "Never-cross / once / twice?", "twin": "Geoboards & Mirrored Symmetry-Plates", "commission": "Capstone 8-Point Star Pavilion: Construct symmetrical 8-point geometric polygons, classify triangles and quadrilaterals.", "production": {"A": "The impossible named", "B": "Palm-row drawing: parallel"}, "deck": null}, {"code": "16-2", "title": "Classify Triangles (p. 589)", "semester": 2, "topic": 16, "topicTitle": "Lines, Angles, and Shapes", "week": 15, "optional": false, "path": "../semester2/lessons/16-2-classify-triangles-p-589.md", "objective": "reason about line segments and angles to classify triangles.", "place": "Qubbat al-Thamaniya · sort triangles", "rifqah": "al-Najm", "hook": "*Sides and angles — not colour.*", "setting": "Sort triangles · sides AND angles", "task": "Not by colour", "twin": "Geoboards & Mirrored Symmetry-Plates", "commission": "Capstone 8-Point Star Pavilion: Construct symmetrical 8-point geometric polygons, classify triangles and quadrilaterals.", "production": {"A": "Two groups + why", "B": "Triangle poster with the sort rule"}, "deck": null}, {"code": "16-3", "title": "Classify Quadrilaterals (p. 593)", "semester": 2, "topic": 16, "topicTitle": "Lines, Angles, and Shapes", "week": 15, "optional": false, "path": "../semester2/lessons/16-3-classify-quadrilaterals-p-593.md", "objective": "reason about line segments and angles to classify quadrilaterals.", "place": "Qubbat al-Thamaniya · four sides", "rifqah": "al-Najm", "hook": "*Opposite parallel. Alike? Different? Not all squares.*", "setting": "Four sides, opposite parallel", "task": "Draw three; not all squares", "twin": "Geoboards & Mirrored Symmetry-Plates", "commission": "Capstone 8-Point Star Pavilion: Construct symmetrical 8-point geometric polygons, classify triangles and quadrilaterals.", "production": {"A": "Three drawings labelled", "B": "Quad family poster"}, "deck": null}, {"code": "16-4", "title": "Line Symmetry (p. 597)", "semester": 2, "topic": 16, "topicTitle": "Lines, Angles, and Shapes", "week": 16, "optional": false, "path": "../semester2/lessons/16-4-line-symmetry-p-597.md", "objective": "recognize and draw lines of symmetry and identify line-symmetric figures.", "place": "Qubbat al-Thamaniya · fold", "rifqah": "al-Najm", "hook": "*A square. A letter. How many honest folds?*", "setting": "Fold a square · fold a letter", "task": "Count lines of symmetry", "twin": "Geoboards & Mirrored Symmetry-Plates", "commission": "Capstone 8-Point Star Pavilion: Construct symmetrical 8-point geometric polygons, classify triangles and quadrilaterals.", "production": {"A": "Count of lines", "B": "Folded-paper drawing"}, "deck": null}, {"code": "16-5", "title": "Draw Shapes with Line Symmetry (p. 601)", "semester": 2, "topic": 16, "topicTitle": "Lines, Angles, and Shapes", "week": 16, "optional": false, "path": "../semester2/lessons/16-5-draw-shapes-with-line-symmetry-p-601.md", "objective": "draw figures with line symmetry.", "place": "Qubbat al-Thamaniya · draw a foldable", "rifqah": "al-Najm", "hook": "*Pretty is not enough. Halves must match.*", "setting": "Draw a shape that can fold", "task": "Half + fold must match", "twin": "Geoboards & Mirrored Symmetry-Plates", "commission": "Capstone 8-Point Star Pavilion: Construct symmetrical 8-point geometric polygons, classify triangles and quadrilaterals.", "production": {"A": "Half + fold", "B": "8-point star sketch (dignity)"}, "deck": null}, {"code": "16-6", "title": "Critique Reasoning (as time allows, p. 605)", "semester": 2, "topic": 16, "topicTitle": "Lines, Angles, and Shapes", "week": 16, "optional": true, "path": "../semester2/lessons/16-6-critique-reasoning-as-time-allows-p-605.md", "objective": "critique the reasoning of others using what I know about two-dimensional shapes.", "place": "Qubbat al-Thamaniya · critique", "rifqah": "al-Najm", "hook": "*If time. Kindness without math is not enough.*", "setting": "Critique with math, not only kindness", "task": "Two-line critique", "twin": "Geoboards & Mirrored Symmetry-Plates", "commission": "Capstone 8-Point Star Pavilion: Construct symmetrical 8-point geometric polygons, classify triangles and quadrilaterals.", "production": {"A": "Critique", "B": "AI critic on the critique"}, "deck": null}], "weeks": [{"semester": 1, "week": 1, "focus": "Orientation · Reinforcement · Diagnostic", "codes": []}, {"semester": 1, "week": 2, "focus": "Lessons 1.1, 1.2, 1.3", "codes": ["1-1", "1-2", "1-3"]}, {"semester": 1, "week": 3, "focus": "Lessons 1.4, 2.1", "codes": ["1-4", "2-1"]}, {"semester": 1, "week": 4, "focus": "Lessons 2.2, 2.3, 2.4", "codes": ["2-2", "2-3", "2-4"]}, {"semester": 1, "week": 5, "focus": "Lessons 2.5, 2.6, 2.7", "codes": ["2-5", "2-6", "2-7"]}, {"semester": 1, "week": 6, "focus": "Lessons 3.1, 3.2, 3.3", "codes": ["3-1", "3-2", "3-3"]}, {"semester": 1, "week": 7, "focus": "Lessons 3.4, 3.6, 3.8", "codes": ["3-4", "3-6", "3-8"]}, {"semester": 1, "week": 8, "focus": "Lessons 4.1, 4.2, 4.3", "codes": ["4-1", "4-2", "4-3"]}, {"semester": 1, "week": 9, "focus": "Lessons 4.5, 5.1, 5.2", "codes": ["4-5", "5-1", "5-2"]}, {"semester": 1, "week": 10, "focus": "Lessons 5.3, 5.4, 5.5", "codes": ["5-3", "5-4", "5-5"]}, {"semester": 1, "week": 11, "focus": "Lessons 5.6, 6.1, 6.2", "codes": ["5-6", "6-1", "6-2"]}, {"semester": 1, "week": 12, "focus": "Lessons 6.3, 6.5, 6.6", "codes": ["6-3", "6-5", "6-6"]}, {"semester": 1, "week": 13, "focus": "Lessons 7.1, 7.2, 7.3", "codes": ["7-1", "7-2", "7-3"]}, {"semester": 1, "week": 14, "focus": "Lessons 7.4, 7.5", "codes": ["7-4", "7-5"]}, {"semester": 1, "week": 15, "focus": "Lessons 8.1, 8.2, 8.3", "codes": ["8-1", "8-2", "8-3"]}, {"semester": 1, "week": 16, "focus": "Lessons 8.4, 8.5, 8.6, 8.7", "codes": ["8-4", "8-5", "8-6", "8-7"]}, {"semester": 1, "week": 17, "focus": "General Revision", "codes": []}, {"semester": 1, "week": 18, "focus": "General Revision", "codes": []}, {"semester": 1, "week": 19, "focus": "Semester 1 Final Examinations", "codes": []}, {"semester": 2, "week": 1, "focus": "Lessons 8.1, 8.2, 8.3", "codes": ["8-1", "8-2", "8-3"]}, {"semester": 2, "week": 2, "focus": "Lessons 8.4, 8.5, 8.6, 8.7", "codes": ["8-4", "8-5", "8-6", "8-7"]}, {"semester": 2, "week": 3, "focus": "Lessons 9.1, 9.2, 9.3", "codes": ["9-1", "9-2", "9-3"]}, {"semester": 2, "week": 4, "focus": "Lessons 9.4 (opt), 9.5, 9.6, 9.7", "codes": ["9-4", "9-5", "9-6", "9-7"]}, {"semester": 2, "week": 5, "focus": "Lessons 9.8, 9.9, 9.10 (opt), 10.1", "codes": ["9-8", "9-9", "9-10", "10-1"]}, {"semester": 2, "week": 6, "focus": "Lessons 10.2, 10.3, 10.4, 10.5 (opt)", "codes": ["10-2", "10-3", "10-4", "10-5"]}, {"semester": 2, "week": 7, "focus": "Lessons 11.1, 11.2, 11.3", "codes": ["11-1", "11-2", "11-3"]}, {"semester": 2, "week": 8, "focus": "Lessons 11.4, 12.1, 12.2", "codes": ["11-4", "12-1", "12-2"]}, {"semester": 2, "week": 9, "focus": "Lessons 12.3, 12.4, 12.5", "codes": ["12-3", "12-4", "12-5"]}, {"semester": 2, "week": 10, "focus": "Lessons 12.6, 13.1, 13.2", "codes": ["12-6", "13-1", "13-2"]}, {"semester": 2, "week": 11, "focus": "Lessons 13.3, 13.4, 13.5", "codes": ["13-3", "13-4", "13-5"]}, {"semester": 2, "week": 12, "focus": "Lessons 13.6, 13.7 (opt), 14.1, 14.2", "codes": ["13-6", "13-7", "14-1", "14-2"]}, {"semester": 2, "week": 13, "focus": "Lessons 14.3, 14.4 (opt), 15.1, 15.2", "codes": ["14-3", "14-4", "15-1", "15-2"]}, {"semester": 2, "week": 14, "focus": "Lessons 15.4, 15.5, 15.6 (opt)", "codes": ["15-4", "15-5", "15-6"]}, {"semester": 2, "week": 15, "focus": "Lessons 16.1, 16.2, 16.3", "codes": ["16-1", "16-2", "16-3"]}, {"semester": 2, "week": 16, "focus": "Lessons 16.4, 16.5, 16.6 (opt)", "codes": ["16-4", "16-5", "16-6"]}, {"semester": 2, "week": 17, "focus": "General Revision", "codes": []}, {"semester": 2, "week": 18, "focus": "General Revision", "codes": []}, {"semester": 2, "week": 19, "focus": "Semester 2 Final Examinations", "codes": []}], "gates": [{"topic": 1, "name": "Lantern Court", "nameAr": "ساحة المصباح", "title": "Generalize Place Value Understanding", "guild": "Census Guild", "lead": "Jadd Tariq", "doors": 4, "color": "#00bed6", "badge": "🏮", "twin": "Place-Value Cups & Glass Marbles (Base 10 grouping)", "commission": "School Census Record: Survey Grade 4 student population, group by tens/hundreds, and draft the caravan register."}, {"topic": 2, "name": "Counting House", "nameAr": "ديوان الحساب", "title": "Fluently Add and Subtract Multi-Digit Whole Numbers", "guild": "Treasury & Weights", "lead": "Abu Layth", "doors": 7, "color": "#17b8be", "badge": "⚖️", "twin": "Brass Two-Pan Balance & Date Seed Counterweights", "commission": "Recycling Weigh-in Audit: Weigh cardboard and plastic bales, calculate sums, differences, and net valley cargo."}, {"topic": 3, "name": "Palm Nursery", "nameAr": "نخيل يوسف", "title": "Use Strategies and Properties to Multiply by 1-Digit Numbers", "guild": "Date Palm Nursery", "lead": "Amm Mansoor", "doors": 6, "color": "#2ec4b6", "badge": "🌴", "twin": "Pegboard Matrix & Colored Elastic Bands (Area Arrays)", "commission": "Date Nursery Planting Grid: Plot 8 irrigation rows with 240 palm saplings each and verify yield using partial products."}, {"topic": 4, "name": "Caravan Workshop", "nameAr": "مشغل القوافل", "title": "Use Strategies and Properties to Multiply by 2-Digit Numbers", "guild": "Logistics & Harnesses", "lead": "Amm Basil", "doors": 5, "color": "#38bdf8", "badge": "🐪", "twin": "Cuisenaire Rod Grids & Segmented Base-10 Tiles", "commission": "Caravan Load Box Grid: Calculate weight distributions for 24 camels carrying 35 standard sacks each."}, {"topic": 5, "name": "Water Share", "nameAr": "قسمة الماء", "title": "Use Strategies and Properties to Divide by 1-Digit Numbers", "guild": "Hydrology & Cisterns", "lead": "Khalid al-Muhandis", "doors": 6, "color": "#0ea5e9", "badge": "💧", "twin": "Volumetric Graduated Beakers & Pipettes (Water Division)", "commission": "Solar Desalination Still: Measure condensation yield, divide evenly among cisterns, and interpret remaining liters."}, {"topic": 6, "name": "Hidden Question", "nameAr": "سوق السؤال", "title": "Use Operations with Whole Numbers to Solve Problems", "guild": "Merchant Chamber", "lead": "Abu Faris", "doors": 5, "color": "#6366f1", "badge": "📜", "twin": "Strip Diagram Tape Ribbons & Market Price Slates", "commission": "Market Day Souq Budget: Manage stall inventory, track multi-step sales, compute hidden costs, and settle trade books."}, {"topic": 7, "name": "Seed Room", "nameAr": "بيت التمر", "title": "Factors and Multiples", "guild": "Harvest Sorting", "lead": "Jadd Tariq", "doors": 5, "color": "#8b5cf6", "badge": "📦", "twin": "Square Tile Grid Array Boards (Prime vs Composite)", "commission": "Date Crate Factor Sorting: Package 36 and 48 dates into all rectangular factor arrays and identify prime batches."}, {"topic": 8, "name": "Same Water", "nameAr": "صحن الظل", "title": "Extend Understanding of Fraction Equivalence and Ordering", "guild": "Solar & Shadow Surveyors", "lead": "Khala Samira", "doors": 14, "color": "#a855f7", "badge": "☀️", "twin": "Magnetic Transparent Fraction-Tiles & Fraction-Towers", "commission": "Courtyard Shadow Fraction Map: Measure shadow lengths at solar noon, generate equivalent fraction ratios on number lines."}, {"topic": 9, "name": "Join and Take", "nameAr": "صفة الإفطار", "title": "Understand Addition and Subtraction of Fractions", "guild": "Hospitality & Rations", "lead": "Amm Bilal", "doors": 10, "color": "#ec4899", "badge": "🍲", "twin": "Segmented Food Sharing Platters & Colored Magnetic Fraction Rings", "commission": "Iftar Share Platters: Decompose flatbreads, add mixed number portions, and subtract rations for the valley journey."}, {"topic": 10, "name": "Many Shares", "nameAr": "قربة الجزء", "title": "Extend Multiplication Concepts to Fractions", "guild": "Water Skin Provisioners", "lead": "Khalid al-Muhandis", "doors": 5, "color": "#f43f5e", "badge": "⏱️", "twin": "Calibrated Water Skins & Unit Fraction Fill Cups", "commission": "Stopwatch Time Trial & Rations: Multiply unit fractions of water per caravan trek hour and solve elapsed time trials."}, {"topic": 11, "name": "Rain Marks", "nameAr": "درب الأثر", "title": "Represent and Interpret Data on Line Plots", "guild": "Valley Trackers", "lead": "Abu Layth", "doors": 4, "color": "#f97316", "badge": "📏", "twin": "Wooden Measuring Rulers & Peg Line Plot Pegboard", "commission": "Hand Span Line Plot Study: Measure student palm spans in fractional eighth-inches, construct line plots, and analyze spreads."}, {"topic": 12, "name": "Small Coins", "nameAr": "دكان الهللة", "title": "Understand and Compare Decimals", "guild": "Mint & Coinage", "lead": "Abu Faris", "doors": 6, "color": "#eab308", "badge": "🪙", "twin": "Hundredth Grid Slates & Decimal Currency Coins (SAR & Halalah)", "commission": "Souq Cashier Register: Convert fractions with tenths/hundredths to decimal currency and compare ledger values."}, {"topic": 13, "name": "Measure House", "nameAr": "ميزان الذراع", "title": "Measurement: Find Equivalence in Units of Measure", "guild": "Master Builders", "lead": "Amm Basil", "doors": 7, "color": "#84cc16", "badge": "📐", "twin": "Trundle Wheel, Yardstick & Metric Caliper Kit", "commission": "School Perimeter & Area Survey: Measure classroom and courtyard dimensions in metric and customary units."}, {"topic": 14, "name": "Rule Room", "nameAr": "سلسلة النجم", "title": "Algebra: Generate and Analyze Patterns", "guild": "Mosaic Guild", "lead": "Khala Samira", "doors": 4, "color": "#10b981", "badge": "✨", "twin": "Geometric Mosaic Pattern Blocks & Number Sequence Strips", "commission": "Star Band Repeating Mosaic: Design geometric mosaic borders using algebraic number rules and repeating shapes."}, {"topic": 15, "name": "Turning Gate", "nameAr": "المزولة", "title": "Geometric Measurement: Understand Concepts of Angles and Angle Measurement", "guild": "Observatory & Dial Masters", "lead": "Khala Samira", "doors": 5, "color": "#06b6d4", "badge": "🧭", "twin": "Brass 360° Rotating Protractors & Gnomon Shadow Pins", "commission": "Courtyard Sundial Build: Measure solar ray angles with protractors, calculate additive angles, and calibrate shadow marks."}, {"topic": 16, "name": "Shape Yard", "nameAr": "قبة الثمانية", "title": "Lines, Angles, and Shapes", "guild": "Grand Architects", "lead": "Jadd Tariq", "doors": 6, "color": "#00bed6", "badge": "🏛️", "twin": "Geoboards & Mirrored Symmetry-Plates", "commission": "Capstone 8-Point Star Pavilion: Construct symmetrical 8-point geometric polygons, classify triangles and quadrilaterals."}], "extras": [{"name": "Wadi Map", "file": "../slides/wadi-map.html", "note": "The year map — fills as doors are sealed."}, {"name": "Experiences", "file": "../slides/EXPERIENCES.html", "note": "The unique job behind every door."}, {"name": "Production", "file": "../slides/PRODUCTION.html", "note": "Stage 6 Stone A or B, with the rubric."}, {"name": "Period Hive", "file": "../slides/period-hive.html", "note": "Practice slips for Stage 3."}, {"name": "Night Zero", "file": "../slides/night-zero.html", "note": "The four-minute opening tale."}], "counts": {"lessons": 99, "decks": 1, "topics": 16, "weeks": 38}};
  chrome();
  render();

  fetch("data/curriculum.json")
    .then(function (r) { return r.json(); })
    .then(function (d) {
      DATA = d;
      render();
    })
    .catch(function () {});

})();
