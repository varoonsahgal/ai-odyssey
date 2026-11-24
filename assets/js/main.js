/* AI ODYSSEY — site behaviour
   Nav/footer injection, starfield, XP + ranks, lab steps, bosses,
   quizzes, badges, tabs, copy buttons, scrollspy, confetti. */
(function () {
  "use strict";

  /* ---------------- Config ---------------- */
  var PAGES = [
    { href: "index.html", label: "Home", key: "home" },
    { href: "syllabus.html", label: "Flight Plan", key: "syllabus" },
    { href: "setup.html", label: "Launch Prep", key: "setup" },
    { href: "day1.html", label: "Day 1", key: "day1", color: "#2ee6a6" },
    { href: "day2.html", label: "Day 2", key: "day2", color: "#4cc9f0" },
    { href: "day3.html", label: "Day 3", key: "day3", color: "#ffb703" },
    { href: "day4.html", label: "Day 4", key: "day4", color: "#8b6cff" },
    { href: "day5.html", label: "Day 5", key: "day5", color: "#ff4d6d" },
    { href: "capstone.html", label: "Capstone", key: "capstone" },
    { href: "field-guide.html", label: "Field Guide", key: "guide" }
  ];
  var RANKS = [
    { xp: 0, name: "Cadet", ico: "🧑‍🚀" },
    { xp: 400, name: "Navigator", ico: "🧭" },
    { xp: 1000, name: "Pilot", ico: "🛩️" },
    { xp: 1800, name: "Flight Engineer", ico: "🔧" },
    { xp: 2800, name: "Commander", ico: "🚀" },
    { xp: 3800, name: "Captain", ico: "🌌" },
    { xp: 5000, name: "Admiral of the Fleet", ico: "👑" }
  ];
  var KEY = "ai-odyssey-progress-v1";

  /* ---------------- Storage (safe) ---------------- */
  var mem = { items: {} };
  function load() {
    try { var raw = localStorage.getItem(KEY); if (raw) mem = JSON.parse(raw) || mem; } catch (e) {}
    if (!mem.items) mem.items = {};
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) {} }
  function has(id) { return Object.prototype.hasOwnProperty.call(mem.items, id); }
  function setItem(id, xp) { mem.items[id] = xp || 0; save(); }
  function unset(id) { delete mem.items[id]; save(); }
  function totalXP() { var t = 0; for (var k in mem.items) t += Number(mem.items[k]) || 0; return Math.round(t); }
  function rankFor(xp) { var r = RANKS[0], next = null; for (var i = 0; i < RANKS.length; i++) { if (xp >= RANKS[i].xp) { r = RANKS[i]; next = RANKS[i + 1] || null; } } return { r: r, next: next }; }

  load();

  /* ---------------- Nav + footer ---------------- */
  var pageKey = document.body.getAttribute("data-page") || "";
  function buildNav() {
    var nav = document.createElement("nav");
    nav.className = "nav";
    var links = PAGES.map(function (p) {
      var dot = p.color ? '<span class="dot" style="background:' + p.color + ';box-shadow:0 0 8px ' + p.color + '"></span>' : "";
      return '<a href="' + p.href + '"' + (p.key === pageKey ? ' class="active"' : "") + ">" + dot + p.label + "</a>";
    }).join("");
    nav.innerHTML =
      '<div class="wrap">' +
      '<a class="brand" href="index.html" aria-label="AI Odyssey home">' +
      '<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="bm" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#4cc9f0"/><stop offset=".5" stop-color="#8b6cff"/><stop offset="1" stop-color="#f72585"/></linearGradient></defs><circle cx="16" cy="16" r="7" fill="url(#bm)"/><ellipse cx="16" cy="16" rx="14.5" ry="5" fill="none" stroke="url(#bm)" stroke-width="1.6" transform="rotate(-25 16 16)"/><circle cx="28" cy="10" r="1.8" fill="#ffb703"/></svg>' +
      '<span>AI ODYSSEY<br><small>GOOGLE CLOUD · 2026</small></span></a>' +
      '<button class="nav-toggle" aria-label="Toggle menu">☰</button>' +
      '<div class="nav-links">' + links +
      '<div class="hud" role="button" tabindex="0" title="Your rank & XP — click for details"><span class="hud-rank">🧑‍🚀</span><span class="hud-text">Cadet · 0 XP</span><span class="hud-bar"><span></span></span></div>' +
      "</div></div>";
    document.body.insertBefore(nav, document.body.firstChild);
    nav.querySelector(".nav-toggle").addEventListener("click", function () { nav.querySelector(".nav-links").classList.toggle("open"); });
    var hud = nav.querySelector(".hud");
    hud.addEventListener("click", openRankModal);
    hud.addEventListener("keydown", function (e) { if (e.key === "Enter") openRankModal(); });

    var f = document.createElement("footer");
    f.innerHTML =
      '<div class="wrap"><div><b style="color:#fff;font-family:var(--font-display)">AI ODYSSEY</b> — a 5-day voyage through advanced AI on Google Cloud.<br>Built for hands-on learners. Platform names and model IDs verified November 2026 — always re-check the <a href="https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/model-versions" target="_blank" rel="noopener">model versions page</a>.</div>' +
      '<div>Photography from <a href="https://unsplash.com" target="_blank" rel="noopener">Unsplash</a> (Unsplash License). Diagrams are original.<br><a href="field-guide.html">Field Guide</a> · <a href="syllabus.html">Flight Plan</a> · <a href="capstone.html">Capstone</a></div></div>';
    document.body.appendChild(f);

    var toast = document.createElement("div"); toast.className = "toast"; toast.id = "toast"; document.body.appendChild(toast);
    var cv = document.createElement("canvas"); cv.id = "confetti"; document.body.appendChild(cv);
    var modal = document.createElement("div"); modal.className = "modal"; modal.id = "rank-modal";
    modal.innerHTML = '<div class="modal-card"><button class="close">Close ✕</button><h3>🛰️ Mission Log</h3><p class="dim">XP is earned by checking off lab steps, defeating boss battles and acing quizzes. Progress is saved in this browser only.</p><div class="ranks"></div><p class="faint" style="font-size:.85rem">Total XP: <b class="tot"></b></p><button class="btn btn-ghost reset" style="font-size:.85rem;padding:8px 16px">Reset my progress</button></div>';
    document.body.appendChild(modal);
    modal.addEventListener("click", function (e) { if (e.target === modal || e.target.classList.contains("close")) modal.classList.remove("open"); });
    modal.querySelector(".reset").addEventListener("click", function () {
      mem = { items: {} }; save(); location.reload();
    });
  }
  function openRankModal() {
    var m = document.getElementById("rank-modal"); var xp = totalXP();
    m.querySelector(".ranks").innerHTML = RANKS.map(function (r) {
      return '<div class="rank-row' + (xp >= r.xp ? " on" : "") + '"><span class="r-ico">' + r.ico + "</span><b>" + r.name + "</b><small>" + r.xp + " XP</small></div>";
    }).join("");
    m.querySelector(".tot").textContent = xp;
    m.classList.add("open");
  }
  var lastRank = null;
  function updateHUD(celebrate) {
    var xp = totalXP(); var rr = rankFor(xp);
    var hud = document.querySelector(".hud"); if (!hud) return;
    hud.querySelector(".hud-rank").textContent = rr.r.ico;
    hud.querySelector(".hud-text").textContent = rr.r.name + " · " + xp + " XP";
    var pct = rr.next ? ((xp - rr.r.xp) / (rr.next.xp - rr.r.xp)) * 100 : 100;
    hud.querySelector(".hud-bar span").style.width = Math.min(100, pct) + "%";
    if (celebrate && lastRank && lastRank !== rr.r.name) {
      toast("RANK UP", rr.r.ico + " You are now a " + rr.r.name + "!"); confetti(220);
    }
    lastRank = rr.r.name;
    updateBadges();
    updateTocProgress();
  }

  /* ---------------- Toast + confetti ---------------- */
  var toastTimer;
  function toast(label, msg) {
    var t = document.getElementById("toast"); if (!t) return;
    t.innerHTML = "<small>" + label + "</small>" + msg;
    t.classList.add("show"); clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 3200);
  }
  function confetti(n) {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var cv = document.getElementById("confetti"); if (!cv) return;
    var ctx = cv.getContext("2d"); cv.width = innerWidth; cv.height = innerHeight;
    var cols = ["#4cc9f0", "#8b6cff", "#f72585", "#ffb703", "#2ee6a6", "#ffffff"];
    var ps = []; for (var i = 0; i < (n || 140); i++) ps.push({ x: innerWidth / 2 + (Math.random() - 0.5) * 200, y: innerHeight * 0.65, vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 18 - 6, r: Math.random() * 6 + 3, c: cols[i % cols.length], a: Math.random() * 6, s: Math.random() > 0.5 });
    var frames = 0;
    (function tick() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      ps.forEach(function (p) { p.vy += 0.45; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += 0.15; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; if (p.s) ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); else { ctx.beginPath(); ctx.arc(0, 0, p.r / 1.5, 0, 6.28); ctx.fill(); } ctx.restore(); });
      if (++frames < 150) requestAnimationFrame(tick); else ctx.clearRect(0, 0, cv.width, cv.height);
    })();
  }

  /* ---------------- Starfield ---------------- */
  function starfields() {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.querySelectorAll("canvas.starfield").forEach(function (cv) {
      var ctx = cv.getContext("2d"), stars = [], W, H, dpr = Math.min(2, window.devicePixelRatio || 1);
      function size() { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        stars = []; var n = Math.floor((W * H) / 5000); for (var i = 0; i < n; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, z: Math.random(), t: Math.random() * 6.28 }); }
      size(); addEventListener("resize", size);
      var shooting = null;
      function draw() {
        ctx.clearRect(0, 0, W, H);
        stars.forEach(function (s) {
          s.t += 0.02 + s.z * 0.02; if (!reduce) { s.x += s.z * 0.15; if (s.x > W) s.x = 0; }
          var a = 0.35 + Math.sin(s.t) * 0.3 + s.z * 0.35;
          ctx.fillStyle = "rgba(255,255,255," + Math.max(0, a) + ")";
          ctx.beginPath(); ctx.arc(s.x, s.y, s.z * 1.4 + 0.2, 0, 6.28); ctx.fill();
        });
        if (!reduce) {
          if (!shooting && Math.random() < 0.006) shooting = { x: Math.random() * W * 0.7, y: Math.random() * H * 0.4, l: 0 };
          if (shooting) {
            shooting.l += 1;
            var g = ctx.createLinearGradient(shooting.x, shooting.y, shooting.x + shooting.l * 9, shooting.y + shooting.l * 4);
            g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(180,220,255,0.9)");
            ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(shooting.x, shooting.y); ctx.lineTo(shooting.x + shooting.l * 9, shooting.y + shooting.l * 4); ctx.stroke();
            if (shooting.l > 40) shooting = null;
          }
          requestAnimationFrame(draw);
        }
      }
      draw();
    });
  }

  /* ---------------- Labs & steps ---------------- */
  function initLabs() {
    document.querySelectorAll(".lab[data-lab]").forEach(function (lab) {
      var id = lab.getAttribute("data-lab");
      var xp = Number(lab.getAttribute("data-xp") || 100);
      var steps = lab.querySelectorAll(".step");
      var per = steps.length ? xp / steps.length : 0;
      if (!lab.querySelector(".lab-complete")) {
        var done = document.createElement("div"); done.className = "lab-complete";
        done.textContent = "🏆 Lab " + id + " complete — +" + xp + " XP banked. Onward, explorer!";
        (lab.querySelector(".lab-body") || lab).appendChild(done);
      }
      steps.forEach(function (st, i) {
        var sid = "step:" + id + ":" + (i + 1);
        var h = st.querySelector("h4") || st;
        var lbl = document.createElement("label"); lbl.className = "step-check";
        lbl.innerHTML = '<input type="checkbox"> done · +' + Math.round(per) + " XP";
        h.appendChild(lbl);
        var cb = lbl.querySelector("input");
        if (has(sid)) { cb.checked = true; st.classList.add("checked"); }
        cb.addEventListener("change", function () {
          if (cb.checked) { setItem(sid, per); st.classList.add("checked"); } else { unset(sid); st.classList.remove("checked"); }
          checkLab(lab, id, steps, true);
          updateHUD(true);
        });
      });
      checkLab(lab, id, steps, false);
    });
  }
  function checkLab(lab, id, steps, celebrate) {
    var all = steps.length > 0 && Array.prototype.every.call(steps, function (s) { return s.classList.contains("checked"); });
    var was = lab.classList.contains("done");
    lab.classList.toggle("done", all);
    if (all) setItem("lab:" + id, 0); else unset("lab:" + id);
    if (all && !was && celebrate) { confetti(160); toast("LAB COMPLETE", "🏆 Lab " + id + " cleared!"); }
  }

  /* ---------------- Boss battles ---------------- */
  function initBosses() {
    document.querySelectorAll(".boss[data-boss]").forEach(function (b) {
      var id = b.getAttribute("data-boss"); var xp = Number(b.getAttribute("data-xp") || 300);
      var items = b.querySelectorAll(".criteria li"); var hp = b.querySelector(".hp span");
      var per = items.length ? xp / items.length : 0;
      function refresh(celebrate) {
        var n = 0; items.forEach(function (li) { if (li.querySelector("input").checked) n++; });
        if (hp) hp.style.width = (100 - (n / items.length) * 100) + "%";
        var dead = n === items.length && n > 0; var was = b.classList.contains("defeated");
        b.classList.toggle("defeated", dead);
        if (dead) setItem("boss:" + id, 0); else unset("boss:" + id);
        if (dead && !was && celebrate) { confetti(300); toast("BOSS DEFEATED", "☠️ → 🏆 " + (b.querySelector("h3") ? b.querySelector("h3").textContent : "Boss") + " defeated!"); }
      }
      items.forEach(function (li, i) {
        var cid = "boss:" + id + ":" + (i + 1);
        var cb = document.createElement("input"); cb.type = "checkbox"; cb.style.cssText = "accent-color:#f72585;margin-right:10px;transform:scale(1.15)";
        li.insertBefore(cb, li.firstChild); li.style.cursor = "pointer";
        if (has(cid)) cb.checked = true;
        li.addEventListener("click", function (e) { if (e.target !== cb && e.target.tagName !== "A" && e.target.tagName !== "CODE") { cb.checked = !cb.checked; cb.dispatchEvent(new Event("change")); } });
        cb.addEventListener("change", function () { if (cb.checked) setItem(cid, per); else unset(cid); refresh(true); updateHUD(true); });
      });
      refresh(false);
    });
  }

  /* ---------------- Quizzes ---------------- */
  function initQuizzes() {
    document.querySelectorAll(".quiz[data-quiz]").forEach(function (qz) {
      var qid = qz.getAttribute("data-quiz"); var qs = qz.querySelectorAll(".q");
      var scoreEl = qz.querySelector(".quiz-score");
      function score() { var c = 0; qs.forEach(function (q, i) { if ((mem.items["quiz:" + qid + ":" + (i + 1)] || 0) > 0) c++; }); if (scoreEl) scoreEl.textContent = c + " / " + qs.length + " correct · +20 XP each"; }
      qs.forEach(function (q, i) {
        var key = "quiz:" + qid + ":" + (i + 1);
        var btns = q.querySelectorAll(".opts button");
        function reveal(chosen) {
          q.classList.add("answered");
          btns.forEach(function (b) { b.disabled = true; if (b.hasAttribute("data-correct")) b.classList.add("right"); });
          if (chosen && !chosen.hasAttribute("data-correct")) chosen.classList.add("wrong");
        }
        if (has(key)) reveal(null);
        btns.forEach(function (b) {
          b.addEventListener("click", function () {
            var ok = b.hasAttribute("data-correct");
            setItem(key, ok ? 20 : 0); reveal(b); score(); updateHUD(true);
            if (ok) toast("CORRECT", "✨ +20 XP");
          });
        });
      });
      score();
    });
  }

  /* ---------------- Badges ---------------- */
  function updateBadges() {
    document.querySelectorAll(".badge[data-req]").forEach(function (b) {
      var req = b.getAttribute("data-req").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
      var ok = req.every(function (r) {
        if (r.indexOf("xp>=") === 0) return totalXP() >= Number(r.slice(4));
        return has(r);
      });
      b.classList.toggle("earned", ok);
    });
  }

  /* ---------------- TOC + scrollspy ---------------- */
  function updateTocProgress() {
    var box = document.querySelector(".toc-progress"); if (!box) return;
    var steps = document.querySelectorAll(".step"); var done = document.querySelectorAll(".step.checked");
    var pct = steps.length ? Math.round((done.length / steps.length) * 100) : 0;
    box.querySelector(".n").textContent = done.length + " / " + steps.length + " steps · " + pct + "%";
    box.querySelector(".bar span").style.width = pct + "%";
  }
  function initToc() {
    var toc = document.querySelector(".toc"); if (!toc) return;
    var links = toc.querySelectorAll("a[href^='#']");
    var map = []; links.forEach(function (a) { var t = document.getElementById(a.getAttribute("href").slice(1)); if (t) map.push([a, t]); });
    function spy() {
      var y = scrollY + 140, cur = null;
      map.forEach(function (m) { if (m[1].getBoundingClientRect().top + scrollY <= y) cur = m[0]; });
      links.forEach(function (a) { a.classList.toggle("active", a === cur); });
    }
    addEventListener("scroll", spy, { passive: true }); spy();
  }

  /* ---------------- Tabs ---------------- */
  function initTabs() {
    document.querySelectorAll(".tabs").forEach(function (t) {
      var btns = t.querySelectorAll(".tab-btns button"); var panels = t.querySelectorAll(".tab-panel");
      btns.forEach(function (b, i) {
        b.addEventListener("click", function () {
          btns.forEach(function (x) { x.classList.remove("active"); }); panels.forEach(function (x) { x.classList.remove("active"); });
          b.classList.add("active"); if (panels[i]) panels[i].classList.add("active");
        });
      });
      if (btns[0] && !t.querySelector(".tab-btns button.active")) btns[0].click();
    });
  }

  /* ---------------- Copy buttons ---------------- */
  function initCopy() {
    document.querySelectorAll("pre").forEach(function (pre) {
      var b = document.createElement("button"); b.className = "copy-btn"; b.type = "button"; b.textContent = "copy";
      b.addEventListener("click", function () {
        var code = pre.querySelector("code") || pre; var txt = code.innerText;
        function ok() { b.textContent = "copied ✓"; b.classList.add("ok"); setTimeout(function () { b.textContent = "copy"; b.classList.remove("ok"); }, 1600); }
        if (navigator.clipboard) navigator.clipboard.writeText(txt).then(ok, function () {}); else { var ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); ok(); } catch (e) {} ta.remove(); }
      });
      pre.appendChild(b);
    });
  }

  /* ---------------- Reveal ---------------- */
  function initReveal() {
    if (!("IntersectionObserver" in window)) { document.querySelectorAll(".reveal").forEach(function (e) { e.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(function (e) { io.observe(e); });
  }

  /* ---------------- Count-up stats ---------------- */
  function initCounters() {
    document.querySelectorAll("[data-count]").forEach(function (el) {
      var end = Number(el.getAttribute("data-count")); var suf = el.getAttribute("data-suffix") || ""; var started = false;
      function run() { if (started) return; started = true; var t0 = performance.now();
        (function f(t) { var p = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(f); })(t0); }
      if ("IntersectionObserver" in window) { var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { run(); io.disconnect(); } }); io.observe(el); } else run();
    });
  }


  /* ---------------- v2: flight bar ---------------- */
  function initFlightbar() {
    var bar = document.createElement("div"); bar.className = "flightbar"; bar.innerHTML = '<div class="fill"></div>';
    document.body.appendChild(bar); var fill = bar.firstChild;
    function upd() { var h = document.documentElement.scrollHeight - innerHeight; fill.style.width = (h > 0 ? Math.min(100, (scrollY / h) * 100) : 0) + "%"; }
    addEventListener("scroll", upd, { passive: true }); addEventListener("resize", upd); upd();
  }

  /* ---------------- v2: side quests ---------------- */
  function initSideQuests() {
    document.querySelectorAll(".sidequest[data-sq]").forEach(function (sq) {
      var id = "sq:" + sq.getAttribute("data-sq"); var xp = Number(sq.getAttribute("data-xp") || 40);
      var btn = sq.querySelector("button");
      if (!btn) { btn = document.createElement("button"); btn.type = "button"; sq.appendChild(btn); }
      function render() { var on = has(id); sq.classList.toggle("claimed", on); btn.textContent = on ? "✓ Claimed +" + xp + " XP" : "Claim +" + xp + " XP"; }
      btn.addEventListener("click", function () {
        if (has(id)) unset(id); else { setItem(id, xp); confetti(90); toast("SIDE QUEST", "🗝️ +" + xp + " XP: " + (sq.querySelector("b") ? sq.querySelector("b").textContent : "quest complete")); }
        render(); updateHUD(true);
      });
      render();
    });
  }

  /* ---------------- v2: lab mission clocks ---------------- */
  function fmt(ms) { var s = Math.round(ms / 1000); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
  function initClocks() {
    var clocks = {};
    try { clocks = JSON.parse(localStorage.getItem(KEY + "-clocks") || "{}"); } catch (e) {}
    function persist() { try { localStorage.setItem(KEY + "-clocks", JSON.stringify(clocks)); } catch (e) {} }
    document.querySelectorAll(".lab[data-lab]").forEach(function (lab) {
      var id = lab.getAttribute("data-lab"); var meta = lab.querySelector(".lab-meta"); if (!meta) return;
      var box = document.createElement("div"); box.className = "lab-clock";
      box.innerHTML = '<button type="button">⏱ Start mission clock</button><span class="best"></span>';
      meta.appendChild(box);
      var btn = box.querySelector("button"), best = box.querySelector(".best"), timer = null, t0 = 0;
      function showBest() { best.textContent = clocks[id] ? "🏅 best " + fmt(clocks[id]) : ""; }
      function stop(record) {
        clearInterval(timer); timer = null; btn.classList.remove("running");
        if (record) { var el = Date.now() - t0; if (!clocks[id] || el < clocks[id]) { clocks[id] = el; persist(); toast("NEW RECORD", "⏱ Lab " + id + " in " + fmt(el)); } }
        btn.textContent = "⏱ Start mission clock"; showBest();
      }
      btn.addEventListener("click", function () {
        if (timer) { stop(false); return; }
        t0 = Date.now(); btn.classList.add("running");
        timer = setInterval(function () { btn.textContent = "⏹ " + fmt(Date.now() - t0) + " · stop"; if (lab.classList.contains("done")) stop(true); }, 500);
      });
      showBest();
    });
  }

  /* ---------------- v2: hero parallax ---------------- */
  function initParallax() {
    var pl = document.querySelector(".hero-planet"); if (!pl || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
    addEventListener("mousemove", function (e) {
      var x = (e.clientX / innerWidth - 0.5) * 18, y = (e.clientY / innerHeight - 0.5) * 18;
      pl.style.translate = x + "px " + y + "px";
    }, { passive: true });
  }

  /* ---------------- Boot ---------------- */
  document.addEventListener("DOMContentLoaded", function () {
    buildNav();
    starfields();
    initLabs();
    initBosses();
    initQuizzes();
    initTabs();
    initCopy();
    initToc();
    initReveal();
    initCounters();
    initFlightbar();
    initSideQuests();
    initClocks();
    initParallax();
    updateHUD(false);
    if (window.Prism) Prism.highlightAll();
  });
})();
