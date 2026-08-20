/* ==========================================================================
   HYPERBULL — main.js
   --------------------------------------------------------------------------
   EDIT HERE — everything project-specific lives in this one CONFIG object.
   ========================================================================== */
const CONFIG = {
  // Solana contract address
  CA: '4eA1t3QnYDipqLVukfxFy8EpJG8b1bC5J2LHYfrcPanX',
  // X / Twitter profile link
  X_URL: 'https://x.com/hyperbull__',
  // Launchpad the token launched on, and the launchpad founder's X
  LAUNCHPAD_URL: 'https://ansem.io',
  ANSEM_URL: 'https://x.com/blknoiz06'
};
/* ========================================================================== */

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ config */
$$('[data-ca]').forEach(el => { el.textContent = CONFIG.CA; });
$$('[data-x-link]').forEach(el => { el.href = CONFIG.X_URL; });
$$('[data-launchpad]').forEach(el => { el.href = CONFIG.LAUNCHPAD_URL; });
$$('[data-ansem]').forEach(el => { el.href = CONFIG.ANSEM_URL; });

/* ================================================================= LIGHTNING
   Shared bolt generator: recursive midpoint displacement.
   ========================================================================== */
function makeBolt(x1, y1, x2, y2, displace, detail = 5) {
  const pts = [[x1, y1], [x2, y2]];
  for (let d = 0; d < detail; d++) {
    const next = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
      const mx = (ax + bx) / 2, my = (ay + by) / 2;
      const dx = bx - ax, dy = by - ay;
      const len = Math.hypot(dx, dy) || 1;
      const off = (Math.random() - 0.5) * displace;
      next.push([mx + (-dy / len) * off, my + (dx / len) * off]);
      next.push(pts[i + 1]);
    }
    pts.length = 0;
    pts.push(...next);
    displace *= 0.55;
  }
  return pts;
}

function drawBolt(ctx, pts, alpha, width, color) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // outer glow
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 26;
  ctx.globalAlpha = alpha * 0.5;
  ctx.lineWidth = width * 3.2;
  strokePts(ctx, pts);

  // core
  ctx.globalAlpha = alpha;
  ctx.lineWidth = width;
  ctx.strokeStyle = '#eafeff';
  ctx.shadowBlur = 14;
  strokePts(ctx, pts);
  ctx.restore();
}

function strokePts(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
}

function fitCanvas(cv) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.floor(cv.clientWidth * dpr);
  cv.height = Math.floor(cv.clientHeight * dpr);
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

/* ------------------------------------------------- generic strike scheduler */
function createStormLayer(canvas, opts = {}) {
  const {
    minDelay = 1800, maxDelay = 5200,
    branches = 2, onStrike = null, dense = false
  } = opts;

  let ctx = fitCanvas(canvas);
  let W = canvas.clientWidth, H = canvas.clientHeight;
  let bolts = [];
  let running = true;

  const resize = () => {
    ctx = fitCanvas(canvas);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
  };
  window.addEventListener('resize', resize);

  function spawn() {
    if (!running) return;
    const x = Math.random() * W;
    const endX = x + (Math.random() - 0.5) * W * 0.5;
    const main = makeBolt(x, -30, endX, H * (dense ? 1.05 : 0.55 + Math.random() * 0.5), W * 0.16, 6);
    const set = [{ pts: main, w: 2.2 }];

    for (let b = 0; b < branches; b++) {
      const from = main[Math.floor(main.length * (0.25 + Math.random() * 0.5))];
      const to = [from[0] + (Math.random() - 0.5) * W * 0.35, from[1] + Math.random() * H * 0.3];
      set.push({ pts: makeBolt(from[0], from[1], to[0], to[1], W * 0.06, 4), w: 1.1 });
    }

    bolts.push({ set, life: 1, decay: 0.035 + Math.random() * 0.03, flicker: 0 });
    if (onStrike) onStrike();

    setTimeout(spawn, minDelay + Math.random() * (maxDelay - minDelay));
  }

  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    for (let i = bolts.length - 1; i >= 0; i--) {
      const b = bolts[i];
      b.life -= b.decay;
      if (b.life <= 0) { bolts.splice(i, 1); continue; }
      const flick = 0.55 + Math.random() * 0.45;
      b.set.forEach(s => drawBolt(ctx, s.pts, b.life * flick, s.w, 'rgba(34,233,255,.95)'));
    }
    requestAnimationFrame(frame);
  }

  if (!REDUCED) {
    setTimeout(spawn, 400 + Math.random() * 900);
    frame();
  }

  return {
    stop() { running = false; window.removeEventListener('resize', resize); ctx.clearRect(0, 0, W, H); },
    strikeNow: spawn
  };
}

/* ================================================================ PRELOADER */
(function preloader() {
  const pre = $('#preloader');
  if (!pre) return;

  const fill = $('#pre-fill');
  const pct = $('#pre-pct');
  const status = $('#pre-status');
  const storm = createStormLayer($('#load-bolts'), { minDelay: 420, maxDelay: 1100, branches: 3, dense: true });

  const lines = ['IGNITING HORNS', 'CHARGING BOLTS', 'SYNCING SOLANA', 'WAKING THE HERD', 'RELEASING THE BULL'];
  let p = 0, done = false;
  const start = Date.now();

  const tick = setInterval(() => {
    p = Math.min(100, p + Math.random() * 9 + 3);
    fill.style.width = p + '%';
    pct.textContent = Math.floor(p) + '%';
    status.textContent = lines[Math.min(lines.length - 1, Math.floor(p / 100 * lines.length))];
    if (p >= 100) { clearInterval(tick); finish(); }
  }, 130);

  function finish() {
    if (done) return;
    done = true;
    const wait = Math.max(0, 2300 - (Date.now() - start));
    setTimeout(() => {
      flashScreen(1);
      pre.classList.add('done');
      document.body.classList.remove('is-loading');
      setTimeout(() => { storm.stop(); pre.remove(); }, 800);
      startReveal();
    }, wait);
  }
})();

/* ==================================================== SCREEN FLASH + STORM */
const flashEl = $('#flash');
function flashScreen(strength = 0.6) {
  if (!flashEl || REDUCED) return;
  flashEl.style.opacity = strength;
  flashEl.classList.add('on');
  setTimeout(() => {
    flashEl.classList.remove('on');
    flashEl.style.opacity = 0;
  }, 90 + Math.random() * 70);
}

createStormLayer($('#fx-bolts'), {
  minDelay: 2600, maxDelay: 7000, branches: 2,
  onStrike: () => { if (Math.random() > 0.45) flashScreen(0.45 + Math.random() * 0.35); }
});

/* ==================================================================== SPARKS */
(function sparks() {
  const cv = $('#fx-sparks');
  if (!cv || REDUCED) return;
  let ctx = fitCanvas(cv);
  let W = cv.clientWidth, H = cv.clientHeight;
  const N = window.innerWidth < 700 ? 34 : 70;
  let parts = [];

  const mk = (y) => ({
    x: Math.random() * W,
    y: y ?? H + Math.random() * H,
    r: Math.random() * 1.8 + 0.4,
    vy: -(Math.random() * 0.5 + 0.15),
    vx: (Math.random() - 0.5) * 0.25,
    a: Math.random() * 0.6 + 0.2,
    t: Math.random() * Math.PI * 2
  });

  const reset = () => {
    ctx = fitCanvas(cv);
    W = cv.clientWidth; H = cv.clientHeight;
    parts = Array.from({ length: N }, () => mk());
  };
  reset();
  window.addEventListener('resize', reset);

  (function loop() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    parts.forEach(p => {
      p.t += 0.02;
      p.y += p.vy;
      p.x += p.vx + Math.sin(p.t) * 0.25;
      if (p.y < -20) Object.assign(p, mk(H + 20));
      const a = p.a * (0.6 + Math.sin(p.t * 2) * 0.4);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(120,244,255,${a})`;
      ctx.shadowColor = 'rgba(34,233,255,.9)';
      ctx.shadowBlur = 10;
      ctx.fill();
    });
    requestAnimationFrame(loop);
  })();
})();

/* ====================================================================== NAV */
const nav = $('#nav');
const navLinks = $('#navLinks');
const burger = $('#burger');

burger?.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  burger.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', String(open));
});
$$('#navLinks a').forEach(a => a.addEventListener('click', () => {
  navLinks.classList.remove('open');
  burger.classList.remove('open');
}));

/* ======================================================== SCROLL PROGRESS */
const spFill = $('#sp-fill');
const toTop = $('#toTop');

function onScroll() {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (spFill) spFill.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
  nav?.classList.toggle('scrolled', y > 40);
  toTop?.classList.toggle('show', y > window.innerHeight * 0.8);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* =================================================================== REVEAL */
let revealStarted = false;
function startReveal() {
  if (revealStarted) return;
  revealStarted = true;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  $$('.reveal').forEach((el, i) => {
    el.style.transitionDelay = (i % 6) * 60 + 'ms';
    io.observe(el);
  });

  // scramble section titles
  const so = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      scramble(e.target);
      so.unobserve(e.target);
    });
  }, { threshold: 0.4 });
  $$('.scramble').forEach(el => so.observe(el));

  // counters
  const co = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      countUp(e.target);
      co.unobserve(e.target);
    });
  }, { threshold: 0.6 });
  $$('.stat__num').forEach(el => co.observe(el));

  // race bars
  const ro = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('run');
      ro.unobserve(e.target);
    });
  }, { threshold: 0.4 });
  $$('.race').forEach(el => ro.observe(el));
}

/* ================================================================= SCRAMBLE */
const CHARS = 'ΛVXZ0123456789#$%&/<>HYPERBUL';
function scramble(el) {
  if (REDUCED) return;
  const text = el.dataset.text || el.textContent;
  let frame = 0;
  const queue = [...text].map((ch, i) => ({ ch, start: i * 2, end: i * 2 + 12 + Math.random() * 14 }));
  const id = setInterval(() => {
    let out = '';
    let done = 0;
    queue.forEach(q => {
      if (frame >= q.end) { out += q.ch; done++; }
      else if (frame >= q.start) out += CHARS[(Math.random() * CHARS.length) | 0];
      else out += ' ';
    });
    el.textContent = out;
    if (done === queue.length) { clearInterval(id); el.textContent = text; }
    frame++;
  }, 28);
}

/* ================================================================== COUNTER */
function countUp(el) {
  const target = parseFloat(el.dataset.count || '0');
  const suffix = el.dataset.suffix || '';
  if (target === 0) { el.textContent = '0' + suffix; return; }
  const dur = 1400;
  const t0 = performance.now();
  (function step(now) {
    const p = Math.min(1, (now - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased).toLocaleString('en-US') + suffix;
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}

/* ================================================================= PARALLAX */
const parallaxEls = $$('.parallax');
if (parallaxEls.length && !REDUCED) {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const vh = window.innerHeight;
      parallaxEls.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const off = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.speed || '0.06');
        el.style.transform = `translate3d(0, ${-off}px, 0)`;
      });
      ticking = false;
    });
  }, { passive: true });
}

/* ===================================================================== TILT */
if (window.matchMedia('(hover:hover) and (pointer:fine)').matches && !REDUCED) {
  $$('.tilt').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${px * 9}deg) rotateX(${-py * 9}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

/* ============================================================= CURSOR GLOW */
const cg = $('#cursorGlow');
if (cg && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
  let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
  window.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
  (function follow() {
    cx += (tx - cx) * 0.12;
    cy += (ty - cy) * 0.12;
    cg.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(follow);
  })();
}

/* =================================================================== COPY CA */
const toast = $('#toast');
const toastMsg = $('#toastMsg');
function showToast(msg) {
  if (!toast) return;
  if (toastMsg) toastMsg.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2200);
}

async function copyCA() {
  try {
    await navigator.clipboard.writeText(CONFIG.CA);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = CONFIG.CA;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch {}
    ta.remove();
  }
  showToast('CONTRACT COPIED');
  flashScreen(0.5);
}
$('#caCopy')?.addEventListener('click', copyCA);
$$('[data-copy-ca]').forEach(b => b.addEventListener('click', copyCA));

/* ================================================================= LIGHTBOX */
(function lightbox() {
  const box = $('#lightbox');
  const img = $('#lbImg');
  if (!box || !img) return;

  const shots = $$('.shot');
  const srcs = shots.map(s => s.dataset.src);
  let idx = 0;

  const show = i => {
    idx = (i + srcs.length) % srcs.length;
    img.src = srcs[idx];
  };
  const open = i => {
    show(i);
    box.classList.add('open');
    document.body.classList.add('no-scroll');
  };
  const close = () => {
    box.classList.remove('open');
    document.body.classList.remove('no-scroll');
  };

  shots.forEach((s, i) => s.addEventListener('click', () => open(i)));
  $('#lbClose').addEventListener('click', close);
  $('#lbPrev').addEventListener('click', e => { e.stopPropagation(); show(idx - 1); });
  $('#lbNext').addEventListener('click', e => { e.stopPropagation(); show(idx + 1); });
  box.addEventListener('click', e => { if (e.target === box) close(); });

  document.addEventListener('keydown', e => {
    if (!box.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
})();

/* ============================================ RANDOM GLITCH ON HERO TITLE */
(function heroGlitch() {
  const t = $('.hero__title');
  if (!t || REDUCED) return;
  setInterval(() => {
    if (Math.random() > 0.55) {
      t.classList.add('is-glitching');
      setTimeout(() => t.classList.remove('is-glitching'), 620);
    }
  }, 4200);
})();

/* =============================================== SMOOTH ANCHOR WITH OFFSET */
$$('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 62;
    window.scrollTo({ top, behavior: REDUCED ? 'auto' : 'smooth' });
  });
});

/* Failsafe: never leave the page stuck behind the preloader. */
setTimeout(() => {
  document.body.classList.remove('is-loading');
  $('#preloader')?.classList.add('done');
  startReveal();
}, 9000);
