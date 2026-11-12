/* App: content render, scroll choreography, HUD, controls, game input, main loop. */
(function () {
  const C = window.MOSPHATE_CONFIG;
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pad = (n, l) => String(n).padStart(l, '0');
  const body = document.body;

  /* ---------- no-WebGL fallback ---------- */
  if (!World) { body.classList.add('nogl', 'booted'); const b = $('boot'); if (b) b.remove(); }

  /* ---------- text content ---------- */
  $('heroSub').textContent = C.hero.sub;
  $('heroText').textContent = C.hero.copy;
  $('ctaLabel').textContent = C.hero.cta;
  $('aboutH').textContent = C.about.heading;
  $('mascotH').textContent = C.mascot.heading; $('mascotLead').textContent = C.mascot.lead;
  $('packH').textContent = C.packaging.heading; $('packLead').textContent = C.packaging.lead;
  $('specH').textContent = C.specs.heading;
  $('journeyH').textContent = C.journey.heading;
  $('teamH').textContent = C.team.heading; $('teamSub').textContent = C.team.sub;
  $('fl1').textContent = C.finale.line; $('fl2').textContent = C.finale.tagline;
  $('yr').textContent = new Date().getFullYear();

  /* about blocks */
  $('story').innerHTML = C.about.blocks.map((b, i) =>
    '<article class="notch"><div class="tag"><span>' + esc(b.tag) + '</span><span>' + pad(i + 1, 2) + '/' + pad(C.about.blocks.length, 2) + '</span></div><h3>' + esc(b.title) + '</h3><p>' + esc(b.text) + '</p></article>').join('');

  /* specs */
  $('specGrid').innerHTML = C.specs.rows.map(r =>
    '<div class="spec' + (r.ph ? ' ph' : '') + (r.wide ? ' wide' : '') + '"><div class="k"><span>' + esc(r.k) + '</span>' + (r.ph ? '<em>TBD</em>' : '') + '</div><div class="v">' + esc(r.v) + '</div></div>').join('');
  const blue = $('blue');
  blue.addEventListener('pointermove', e => { const r = blue.getBoundingClientRect(); blue.style.setProperty('--mx', (e.clientX - r.left) + 'px'); blue.style.setProperty('--my', (e.clientY - r.top) + 'px'); });

  /* journey cards */
  const steps = C.journey.steps;
  $('jTrack').innerHTML = steps.map(s =>
    '<article class="j-card notch"><div class="n"><b>' + esc(s.n) + '</b> // ' + esc(s.name) + '</div><h3>' + esc(s.name) + '</h3><p class="sub">' + esc(s.sub) + '</p><div class="slot">' +
    (s.media ? '' : '[ ' + esc(s.slot) + ' ]') + '</div></article>').join('') + '<div class="j-end"></div>';
  $('jNodes').innerHTML = steps.map(() => '<i></i>').join('');
  document.querySelectorAll('.j-card').forEach((el, i) => {
    const m = steps[i].media; if (!m) return;
    const slot = el.querySelector('.slot');
    const isVid = /\.(mp4|webm)$/i.test(m);
    const n = document.createElement(isVid ? 'video' : 'img');
    n.src = m; if (isVid) { n.muted = true; n.loop = true; n.autoplay = true; n.playsInline = true; }
    n.onload = n.onloadeddata = () => { slot.textContent = ''; slot.appendChild(n); };
  });

  /* team */
  const AV = '<svg viewBox="0 0 120 130" fill="none" stroke="#c0c0c0" stroke-width="1.2"><path d="M60 8 L92 26 L92 52 L60 70 L28 52 L28 26 Z"/><path d="M60 8 L60 70 M28 26 L92 52 M92 26 L28 52" opacity=".5"/><path d="M14 126 L14 100 L36 82 L84 82 L106 100 L106 126" /><path d="M36 82 L60 98 L84 82 M60 98 L60 126" opacity=".5"/></svg>';
  $('teamGrid').innerHTML = C.team.members.map((m, i) =>
    '<article class="member notch"><div class="slotno"><span>SLOT ' + pad(i + 1, 2) + '</span><span>' + (m.name ? 'ACTIVE' : 'EMPTY') + '</span></div>' +
    '<div class="avatar">' + AV + '<div class="scanl"></div><div class="lab">' + (m.photo ? '' : '[TEAM MEMBER PHOTO]') + '</div></div>' +
    '<div class="f">NAME</div><div class="val name">' + (m.name ? esc(m.name) : '<span style="color:var(--dim);font-weight:700">[MEMBER NAME]</span>') + '</div>' +
    '<div class="f">ROLE</div><div class="val">' + (m.role ? esc(m.role) : '<span style="color:var(--dim)">[ROLE / DESIGNATION]</span>') + '</div>' +
    '<div class="f">ABOUT</div><div class="val">' + (m.desc ? esc(m.desc) : '<span style="color:var(--dim)">[SHORT DESCRIPTION]</span>') + '</div></article>').join('');
  document.querySelectorAll('.member').forEach((el, i) => {
    const p = C.team.members[i].photo; if (!p) return;
    const im = new Image(); im.alt = C.team.members[i].name || ''; im.src = p;
    im.onload = () => { const a = el.querySelector('.avatar'); a.querySelector('svg').remove(); a.querySelector('.scanl').remove(); a.querySelector('.lab').remove(); a.appendChild(im); };
  });
  document.querySelectorAll('.member').forEach(el => {
    el.addEventListener('pointermove', e => {
      if (App.reduced) return;
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = 'rotateY(' + (x * 14) + 'deg) rotateX(' + (-y * 14) + 'deg) translateZ(8px)';
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  /* footer */
  if (C.contact.email) $('mailTxt').textContent = C.contact.email; else { $('mailTxt').textContent = '[CONTACT EMAIL — EDIT IN CONFIG]'; $('mailCopy').hidden = true; }
  $('mailCopy').addEventListener('click', () => {
    const b = $('mailCopy'), done = () => { b.textContent = 'COPIED'; setTimeout(() => b.textContent = 'COPY', 1400); };
    try { navigator.clipboard.writeText(C.contact.email).then(done, () => {}); } catch (e) {}
  });
  $('socials').innerHTML = C.contact.socials.map(s => s.url
    ? '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name.toUpperCase()) + '</a>'
    : '<a href="#" aria-disabled="true" tabindex="0" onclick="return false" title="Add URL in config">' + esc(s.name.toUpperCase()) + '</a>').join('');

  /* ---------- split text + pixel wipes ---------- */
  document.querySelectorAll('.split').forEach(el => {
    const txt = el.textContent; el.setAttribute('aria-label', txt); el.textContent = '';
    let i = 0;
    txt.split(' ').forEach((w, wi, arr) => {
      const ws = document.createElement('span'); ws.className = 'w'; ws.setAttribute('aria-hidden', 'true');
      for (const ch of w) { const c = document.createElement('span'); c.className = 'c'; c.style.setProperty('--i', i++); c.textContent = ch; ws.appendChild(c); }
      el.appendChild(ws); if (wi < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
    el.classList.add('pre');
  });
  const wipe = $('wipe1'); for (let i = 0; i < 48; i++) { const b = document.createElement('i'); b.style.setProperty('--d', (Math.random() * 0.5).toFixed(2) + 's'); wipe.appendChild(b); }
  wipe.classList.add('pre');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.remove('pre'); if (e.target.classList.contains('split')) SFX.tick(); io.unobserve(e.target); } }), { threshold: 0.25 });
    document.querySelectorAll('.split,.pxwipe').forEach(el => io.observe(el));
  } else document.querySelectorAll('.pre').forEach(el => el.classList.remove('pre'));

  /* ---------- HUD toggles ---------- */
  const snd = $('sndBtn'), mot = $('motionBtn');
  snd.addEventListener('click', () => { const on = SFX.toggle(); snd.setAttribute('aria-pressed', on); snd.textContent = 'SND: ' + (on ? 'ON' : 'OFF'); });
  function setReduced(v) { App.reduced = v; body.classList.toggle('rm', v); mot.setAttribute('aria-pressed', v); mot.textContent = 'MOTION: ' + (v ? 'REDUCED' : 'FULL'); }
  setReduced(!!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches));
  mot.addEventListener('click', () => setReduced(!App.reduced));

  /* ---------- CTA / replay ---------- */
  function scrollToEl(el, dur) {
    const y = el.getBoundingClientRect().top + window.scrollY - 0;
    if (App.reduced) { window.scrollTo(0, y); return; }
    const y0 = window.scrollY, t0 = performance.now(), d = dur || 1400;
    App.boosted = 1;
    (function step(n) { const k = Math.min(1, (n - t0) / d), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; window.scrollTo(0, y0 + (y - y0) * e); if (k < 1) requestAnimationFrame(step); })(t0);
  }
  $('cta').addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); SFX.whoosh(); scrollToEl($('about')); });
  $('hudMark').addEventListener('click', e => { e.preventDefault(); scrollToEl($('hero'), 1000); });
  $('replay').addEventListener('click', () => { SFX.whoosh(); scrollToEl($('hero'), 2400); });

  /* ---------- game input ---------- */
  const hero = $('hero');
  addEventListener('keydown', e => {
    if (e.code !== 'Space' && e.key !== ' ') return;
    const t = e.target; if (t && (t.tagName === 'BUTTON' || t.tagName === 'A' || t.tagName === 'INPUT')) return;
    if (World && window.scrollY < App.vh * 0.85) { e.preventDefault(); World.jump(); }
  });
  hero.addEventListener('pointerdown', e => { if (e.target.closest('a,button')) return; if (World) World.jump(); });
  const sc = $('sc'), hi = $('hi'), hint = $('hint');
  App.onGame = (state, s, h) => {
    sc.textContent = pad(s, 5); hi.textContent = pad(h, 5);
    hint.textContent = state === 'dead' ? 'GAME OVER // SPACE TO RETRY' : state === 'run' ? 'KEEP RUNNING' : 'SPACE / TAP TO JUMP';
    if (state === 'run' && s > 0 && s % 100 === 0) { sc.classList.remove('pop'); void sc.offsetWidth; sc.classList.add('pop'); }
  };
  if (World) { hi.textContent = pad(World.G.hi, 5); }

  /* ---------- boot overlay ---------- */
  const bootEl = $('boot'), bp = $('bootPct'), bb = $('bootBar'), bl = $('bootLog');
  const logs = ['MOUNTING VOXEL CORE', 'SPAWNING DINO_01', 'BUILDING DESERT GRID', 'SEEDING STARFIELD', 'LINKING CAMERA RIG', 'READY'];
  App.onBoot = bt => {
    const p = Math.min(1, bt / 2.4);
    const pct = Math.floor(p * 100);
    bp.textContent = pad(pct, 2) + '%'; bb.style.width = (Math.floor(p * 28) / 28 * 100) + '%';
    bl.textContent = '> ' + logs[Math.min(logs.length - 1, Math.floor(p * logs.length))];
    if (bt > 1.0 && bootEl && !bootEl.classList.contains('off')) bootEl.classList.add('off');
  };
  if (World) {
    /* Don't let a hidden tab stall the intro. */
    setTimeout(() => { if (!World.boot.done) { World.boot.t = Math.max(World.boot.t, 4.4); } }, 9000);
  }

  /* ---------- stages ---------- */
  const lbl = { front: 'FRONT VIEW', side: 'SIDE PROFILE', rear: 'REAR VIEW', close: 'CLOSE-UP DETAIL' };
  let M = null, P = null;
  try { M = Stages && Stages.mascot(C.mascot); } catch (e) { M = null; }
  try {
    P = Stages && Stages.packaging(C.packaging, (u, ex) => {
      $('pState').textContent = ex > 0.5 ? 'EXPLODED' : u > 0.85 ? 'OPEN' : u < 0.1 ? 'SEALED' : 'UNBOXING';
    });
  } catch (e) { P = null; }

  function btn(txt, fn, cls) { const b = document.createElement('button'); b.className = 'btn ghost' + (cls ? ' ' + cls : ''); b.textContent = txt; b.addEventListener('click', () => { SFX.tick(); fn(b); }); return b; }
  function group(host, items, onPick) {
    const btns = items.map((it, i) => { const b = btn('[' + it[1] + ']', () => { btns.forEach(x => x.classList.remove('on')); b.classList.add('on'); onPick(it[0]); }); if (i === 0) b.classList.add('on'); host.appendChild(b); return b; });
    return btns;
  }
  if (M) {
    const host = $('mascotCtl');
    const mb = group(host, [['front', 'FRONT VIEW'], ['side', 'SIDE PROFILE'], ['rear', 'REAR VIEW'], ['close', 'CLOSE-UP DETAIL']], k => { M.orb.go(M.presets[k]); $('mView').textContent = lbl[k]; });
    const sp = document.createElement('span'); sp.className = 'sp'; host.appendChild(sp);
    host.appendChild(btn('ZOOM +', () => M.orb.zoom(0.8))); host.appendChild(btn('ZOOM −', () => M.orb.zoom(1.25)));
  } else { $('mascotFrame').insertAdjacentHTML('beforeend', '<div class="media-pane on"><span class="eyebrow">3D STAGE UNAVAILABLE ON THIS DEVICE</span></div>'); }

  /* universal media slot: swap in gallery / video if configured */
  (function mediaSlot() {
    const pane = $('mascotMedia'), cfg = C.mascot, host = $('mascotCtl');
    if (!M) return;
    const tryLoad = (url, isVid, ok) => {
      if (isVid) { const v = document.createElement('video'); v.src = url; v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true; v.controls = true; v.onloadeddata = () => ok(v); }
      else { const i = new Image(); i.onload = () => ok(i); i.src = url; i.alt = ''; }
    };
    let added = false;
    function addToggle(label, build) {
      const b = btn('[' + label + ']', () => {
        const on = !pane.classList.contains('on') || pane.dataset.k !== label;
        pane.classList.toggle('on', on); pane.dataset.k = on ? label : '';
        if (on) { pane.innerHTML = ''; pane.appendChild(build()); $('mSlot').textContent = 'MEDIA SLOT: ' + label; } else $('mSlot').textContent = 'MEDIA SLOT: PROCEDURAL';
      }); host.appendChild(b);
    }
    if (cfg.gallery && cfg.gallery.length) {
      const ok = []; cfg.gallery.forEach(u => tryLoad(u, false, im => { ok.push(im); if (!added) { added = true; addToggle('GALLERY', () => { const g = document.createElement('div'); g.className = 'gal'; ok.forEach(i => g.appendChild(i.cloneNode())); return g; }); } }));
    }
    if (cfg.video) tryLoad(cfg.video, true, v => addToggle('TURNTABLE', () => v));
  })();

  if (P) {
    const host = $('packCtl');
    let sealed = true;
    const ub = btn('[UNBOX]', () => { sealed = !sealed; P.setExplode(0); P.setUnbox(sealed ? 0 : 1); ub.textContent = sealed ? '[UNBOX]' : '[SEAL]'; SFX.chime(); });
    ub.classList.remove('ghost'); ub.classList.add('btn'); ub.style.padding = '13px 14px'; ub.style.fontSize = '9px'; ub.style.boxShadow = '3px 3px 0 var(--dim)'; ub.style.cursor = 'pointer';
    host.appendChild(ub);
    const vb = group(host, [['front', 'FRONT'], ['back', 'BACK'], ['side', 'SIDE'], ['exploded', 'EXPLODED']], k => {
      P.orb.go(P.presets[k]); $('pView').textContent = k.toUpperCase();
      if (k === 'exploded') { P.setExplode(1); sealed = false; ub.textContent = '[SEAL]'; } else P.setExplode(0);
    });
    const sp = document.createElement('span'); sp.className = 'sp'; host.appendChild(sp);
    host.appendChild(btn('ZOOM +', () => P.orb.zoom(0.8))); host.appendChild(btn('ZOOM −', () => P.orb.zoom(1.25)));
  }

  /* ---------- journey pin ---------- */
  const jSec = $('journey'), jTrack = $('jTrack'), jView = $('jView'), jFill = $('jFill');
  const jCards = [].slice.call(document.querySelectorAll('.j-card')), jNodes = [].slice.call($('jNodes').children);
  let jWrap = null, jDist = 0, jOffset = 0, jH = 0;
  function layoutJourney() {
    if (!jWrap) {
      jWrap = document.createElement('div'); jWrap.style.cssText = 'position:relative;z-index:2';
      jSec.parentNode.insertBefore(jWrap, jSec); jWrap.appendChild(jSec);
      jSec.style.position = 'sticky'; jSec.style.top = '0';
    }
    jH = window.innerHeight;
    jSec.style.height = jH + 'px';
    jDist = Math.max(0, jTrack.scrollWidth - window.innerWidth);
    jWrap.style.height = (jH + jDist * 1.0 + jH * 0.2) + 'px';
  }
  function updateJourney() {
    const r = jWrap.getBoundingClientRect(), total = jWrap.offsetHeight - jH;
    const p = clamp(-r.top / Math.max(1, total), 0, 1), pp = clamp(p / 0.92, 0, 1);
    jOffset = lerp(jOffset, pp * jDist, App.reduced ? 1 : 0.14);
    jTrack.style.transform = 'translate3d(' + (-jOffset) + 'px,0,0)';
    jFill.style.transform = 'scaleX(' + pp + ')';
    const cx = window.innerWidth * 0.5;
    jCards.forEach((c, i) => {
      const b = c.getBoundingClientRect(), d = clamp((b.left + b.width / 2 - cx) / window.innerWidth, -1.2, 1.2);
      c.style.transform = App.reduced ? '' : 'translateZ(' + (-Math.abs(d) * 160) + 'px) rotateY(' + (-d * 16) + 'deg) translateY(' + (Math.abs(d) * 14) + 'px)';
      c.style.opacity = 1 - clamp(Math.abs(d) - 0.55, 0, 0.6);
      const on = pp >= (i / (jCards.length)) + 0.5 / jCards.length * 0.2;
      if (jNodes[i]) jNodes[i].classList.toggle('on', pp >= i / (jCards.length - 1) - 0.001);
    });
  }

  /* ---------- scroll state ---------- */
  const secs = ['hero', 'about', 'mascot', 'packaging', 'specs', 'journey', 'team', 'finale'].map($);
  let lastCh = -1;
  function updateScroll() {
    App.scrollY = window.scrollY; App.vh = window.innerHeight;
    const mid = App.vh * 0.5;
    let idx = 0, f = 0;
    for (let i = 0; i < secs.length; i++) { if (secs[i].getBoundingClientRect().top <= mid) idx = i; }
    const cur = secs[idx].getBoundingClientRect();
    if (idx < secs.length - 1) {
      const nxt = secs[idx + 1].getBoundingClientRect();
      const span = Math.max(1, nxt.top - cur.top);
      f = idx + clamp((mid - cur.top) / span, 0, 1);
    } else f = idx;
    /* The journey section is a sticky pin: keep its chapter steady while pinned. */
    if (jWrap) {
      const r = jWrap.getBoundingClientRect();
      if (r.top <= 0 && r.bottom >= App.vh) f = 5;
      else if (idx === 4 || idx === 5) {
        const toJ = r.top / App.vh;
        if (r.top > 0) f = 4 + clamp(1 - toJ, 0, 1);
        else f = 5 + clamp((App.vh - r.bottom) / App.vh, 0, 1);
      }
    }
    App.fIdx = f;
    const ft = $('fTrack').getBoundingClientRect(), fe = ft.height - App.vh;
    App.fp = clamp(-ft.top / Math.max(1, fe), 0, 1);

    const docH = document.documentElement.scrollHeight - App.vh;
    const pr = docH > 0 ? App.scrollY / docH : 0;
    $('hudY').textContent = pad(Math.round(App.scrollY), 4);
    $('hudP').textContent = pad(Math.round(pr * 100), 3) + '%';
    const ch = Math.round(f) + 1;
    $('hudC').textContent = pad(ch, 2) + '/08';
    if (ch !== lastCh) { if (lastCh !== -1) SFX.chime(); lastCh = ch; }

    /* finale copy */
    const l1 = smooth((App.fp - 0.62) / 0.14), l2 = smooth((App.fp - 0.8) / 0.12);
    const fl1 = $('fl1'), fl2 = $('fl2');
    fl1.style.opacity = l1; fl1.style.transform = 'translateY(' + ((1 - l1) * 16) + 'px)'; fl2.style.opacity = l2;
  }

  /* ---------- pointer parallax ---------- */
  addEventListener('pointermove', e => { App.mx = (e.clientX / window.innerWidth - 0.5) * 2; App.my = (e.clientY / window.innerHeight - 0.5) * 2; }, { passive: true });
  /* phones: tilt-free, but still let touch drift nudge the parallax */

  /* ---------- resize ---------- */
  function onResize() { App.vh = window.innerHeight; layoutJourney(); if (World) World.resize(); }
  addEventListener('resize', onResize);
  layoutJourney();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutJourney);
  addEventListener('load', layoutJourney);
  history.scrollRestoration = 'manual';

  /* ---------- loop ---------- */
  let last = performance.now(), T = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt; App.t = T;
    updateScroll(); updateJourney();
    if (World) { try { World.frame(dt, T); } catch (e) { console.error(e); } }
    if (Stages) { try { Stages.frame(dt, T); } catch (e) { console.error(e); } }
  }
  requestAnimationFrame(loop);
  if (!World) {
    body.classList.add('booted');
  } else {
    window.scrollTo(0, 0);
  }
})();
