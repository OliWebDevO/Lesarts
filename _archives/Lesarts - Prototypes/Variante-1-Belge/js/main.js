/* ── PRELOADER ─────────────────────────────────────────────
   Waits for all images to load before revealing the site.
   Forces eager loading so lazy images below the fold don't
   stall the progress bar while scrolling is blocked.
───────────────────────────────────────────────────────────── */
function v1InitPreloader(onReady) {
  var overlay = document.getElementById('v1-preloader');
  var fill    = document.getElementById('v1-fill');
  var pctEl   = document.getElementById('v1-pct');

  document.body.style.overflow = 'hidden';

  var preferredReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!overlay) { document.body.style.overflow = ''; onReady(); return; }

  var MIN_MS     = 600;
  var start      = Date.now();
  var images     = Array.from(document.images);
  var done       = 0;
  var total      = images.length;
  var safetyTimer;

  function dismiss() {
    clearTimeout(safetyTimer);
    document.body.style.overflow = '';
    if (typeof gsap === 'undefined' || preferredReduced) {
      overlay.style.display = 'none';
      onReady();
      return;
    }
    gsap.to(overlay, {
      clipPath: 'inset(0 0 100% 0)',
      duration: 1.1,
      ease: 'power4.inOut',
      onComplete: function() { overlay.style.display = 'none'; onReady(); }
    });
  }

  if (!total) { safetyTimer = setTimeout(dismiss, MIN_MS); return; }

  function tick() {
    done = Math.min(done + 1, total);
    var p = Math.round((done / total) * 100);
    if (fill)  fill.style.width  = p + '%';
    if (pctEl) pctEl.textContent = p + '%';
    overlay.setAttribute('aria-valuenow', p);
    if (done >= total) {
      clearTimeout(safetyTimer);
      var wait = Math.max(0, MIN_MS - (Date.now() - start));
      setTimeout(dismiss, wait);
    }
  }

  // Safety valve — dismiss after 10 s regardless of network
  safetyTimer = setTimeout(function() { done = total; dismiss(); }, 10000);

  // After an image loads, also wait for it to be decoded.
  // Browsers download images (load event) but decode them lazily —
  // the first-paint decode causes jank even after the preloader.
  // img.decode() forces synchronous decode so every image is
  // GPU-ready before the page is revealed.
  function afterLoadAndDecode(img) {
    if (typeof img.decode === 'function') {
      img.decode().catch(function() {}).then(tick);
    } else {
      tick();
    }
  }

  images.forEach(function(img) {
    // Force eager — lazy images below fold never fire 'load'
    // while the preloader blocks scrolling
    if (img.loading === 'lazy') img.loading = 'eager';

    if (!img.src && !img.srcset) {
      setTimeout(tick, 0); // no source — count immediately
    } else if (img.complete && img.naturalWidth > 0) {
      afterLoadAndDecode(img); // already downloaded — still decode
    } else {
      img.addEventListener('load',  function() { afterLoadAndDecode(img); }, { once: true });
      img.addEventListener('error', tick, { once: true });
    }
  });
}

/* ============================================================
   LES ARTS — Variante 1 · Objects With Narratives Style
   main.js

   Animations inspired by objectswithnarratives.com:
   1. Clip-path parallelogram wipe on every image (THE signature)
   2. Scroll-direction-aware text reveals (y:100 enter-down, y:-100 enter-up)
   3. Asymmetric hover scale — 0.8s in / 0.3s out
   4. Staggered hero load sequence
   5. Service rows slide from left
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ─────────────────────────────────────────────────────────────
     NAV — transparent → opaque on scroll
  ───────────────────────────────────────────────────────────── */
  const siteHeader = document.querySelector('.site-header');
  const onScroll   = () => siteHeader?.classList.toggle('site-header--scrolled', window.scrollY > 60);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ─────────────────────────────────────────────────────────────
     SIDEBAR
  ───────────────────────────────────────────────────────────── */
  const burgerBtn    = document.querySelector('.site-nav__burger');
  const sidebarNav   = document.getElementById('sidebar-nav');
  const closeBtn     = document.querySelector('.sidebar-nav__close');
  const backdrop     = document.querySelector('.sidebar-nav__backdrop');
  const sidebarLinks = document.querySelectorAll('.sidebar-nav__link');

  const openSidebar = () => {
    sidebarNav.setAttribute('aria-hidden', 'false');
    burgerBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    closeBtn?.focus();
    // Animate sidebar links in — stagger from y:20
    if (typeof gsap !== 'undefined') {
      gsap.fromTo('.sidebar-nav__link',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: 'power2.out', delay: 0.1 }
      );
    }
  };

  const closeSidebar = () => {
    sidebarNav.setAttribute('aria-hidden', 'true');
    burgerBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    burgerBtn?.focus();
  };

  burgerBtn?.addEventListener('click', openSidebar);
  closeBtn?.addEventListener('click', closeSidebar);
  backdrop?.addEventListener('click', closeSidebar);
  sidebarLinks.forEach(l => l.addEventListener('click', closeSidebar));
  sidebarNav?.addEventListener('keydown', e => { if (e.key === 'Escape') closeSidebar(); });

  /* ─────────────────────────────────────────────────────────────
     GALLERY — GSAP-powered smooth drag / swipe / snap
     - Pointer Events API (unified mouse + touch)
     - Real-time GSAP set for butter-smooth tracking
     - Velocity-based momentum snap on release
     - Rubberband resistance at both edges
     - Images never draggable natively
  ───────────────────────────────────────────────────────────── */
  (() => {
    const viewport = document.querySelector('.gallery__viewport');
    const track    = document.querySelector('.gallery__track');
    if (!track || !viewport) return;

    const cards   = [...track.querySelectorAll('.gallery__card')];
    const prevBtn = document.querySelector('.gallery__arrow--prev');
    const nextBtn = document.querySelector('.gallery__arrow--next');
    const pagEl   = document.querySelector('.gallery__pagination');

    // No native image drag
    track.querySelectorAll('img').forEach(img => img.setAttribute('draggable', 'false'));

    let x          = 0;     // current GSAP x value
    let dragStartX = 0;     // pointer clientX at drag start
    let dragStartT = 0;     // track x at drag start
    let isDragging = false;
    let velX       = 0;     // velocity in px/s
    let prevPointerX = 0;
    let prevPointerT = 0;

    /* ── Helpers ─────────────────────────────────────────────── */
    const clamp      = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

    const rubberband = (v, lo, hi, k = 0.18) => {
      if (v > hi) return hi + (v - hi) * k;
      if (v < lo) return lo + (v - lo) * k;
      return v;
    };

    // Width of one card + its gap = one "step"
    const getStep = () => {
      const w   = cards[0]?.offsetWidth ?? 300;
      const gap = parseFloat(getComputedStyle(track).columnGap ||
                             getComputedStyle(track).gap) || 32;
      return w + gap;
    };

    // Minimum x: last card's right edge at viewport right edge
    const getMinX = () => {
      const inset = parseFloat(getComputedStyle(viewport).paddingLeft) || 0;
      return Math.min(0, viewport.clientWidth - inset - track.scrollWidth);
    };

    // How many cards fit in the viewport
    const visibleCount = () =>
      window.innerWidth >= 1280 ? 3 : window.innerWidth >= 768 ? 2 : 1;

    // Current page index (0-based)
    const currentPage = () => Math.round(-x / getStep());

    /* ── Pagination / button state ───────────────────────────── */
    const updateUI = () => {
      if (!pagEl) return;
      const total = Math.max(1, cards.length - visibleCount() + 1);
      const page  = clamp(currentPage(), 0, total - 1);
      pagEl.textContent   = `${page + 1} / ${total}`;
      if (prevBtn) prevBtn.disabled = page === 0;
      if (nextBtn) nextBtn.disabled = page >= total - 1;
    };

    /* ── Snap to nearest step with momentum ──────────────────── */
    const snapTo = (fromX, velocity = 0) => {
      const step  = getStep();
      const minX  = getMinX();

      // Project a little further based on flick velocity
      const projected = clamp(fromX + velocity * 0.16, minX, 0);

      // Round to nearest step
      const snapped = clamp(
        Math.round(projected / step) * step,
        minX, 0
      );

      // Duration scales with distance but stays snappy
      const dist = Math.abs(snapped - fromX);
      const dur  = clamp(dist / 1400 + 0.28, 0.28, 0.62);

      gsap.to(track, {
        x:        snapped,
        duration: dur,
        ease:     'power3.out',
        onUpdate:  () => { x = gsap.getProperty(track, 'x'); },
        onComplete: () => { x = snapped; updateUI(); },
      });
    };

    /* ── Go to specific page (arrows) ────────────────────────── */
    const goToPage = (page) => {
      const step    = getStep();
      const minX    = getMinX();
      const maxPage = Math.max(0, cards.length - visibleCount());
      const target  = clamp(-clamp(page, 0, maxPage) * step, minX, 0);

      gsap.to(track, {
        x:        target,
        duration: 0.62,
        ease:     'power3.inOut',
        onUpdate:  () => { x = gsap.getProperty(track, 'x'); },
        onComplete: () => { x = target; updateUI(); },
      });
    };

    /* ── Pointer events ─────────────────────────────────────────
       Pointer Events unify mouse, touch, and pen in one API.
       setPointerCapture keeps events firing even if pointer
       leaves the element during a fast drag.
    ──────────────────────────────────────────────────────────── */
    track.addEventListener('pointerdown', (e) => {
      // Only primary button on mouse; allow all on touch/pen
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      isDragging   = true;
      dragStartX   = e.clientX;
      dragStartT   = x;
      prevPointerX = e.clientX;
      prevPointerT = performance.now();
      velX         = 0;

      track.setPointerCapture(e.pointerId);
      track.classList.add('is-dragging');
      gsap.killTweensOf(track);
    });

    track.addEventListener('pointermove', (e) => {
      if (!isDragging) return;

      // Track velocity (px / second)
      const now = performance.now();
      const dt  = now - prevPointerT || 1;
      velX      = (e.clientX - prevPointerX) / dt * 1000;
      prevPointerX = e.clientX;
      prevPointerT = now;

      // Translate track, with rubberband at edges
      const delta = e.clientX - dragStartX;
      const newX  = rubberband(dragStartT + delta, getMinX(), 0);
      gsap.set(track, { x: newX });
      x = newX;
    });

    const endDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      track.classList.remove('is-dragging');
      snapTo(x, velX);
    };

    track.addEventListener('pointerup',     endDrag);
    track.addEventListener('pointercancel', endDrag);

    // Prevent link clicks after a meaningful drag
    track.addEventListener('click', (e) => {
      if (Math.abs(dragStartT - x) > 8) e.preventDefault();
    }, true);

    /* ── Arrows ─────────────────────────────────────────────── */
    prevBtn?.addEventListener('click', () => goToPage(currentPage() - 1));
    nextBtn?.addEventListener('click', () => goToPage(currentPage() + 1));

    /* ── Trackpad two-finger horizontal swipe (wheel events) ────
       On macOS, two-finger swipes fire as wheel events with deltaX.
       We intercept horizontal-dominant wheel events and translate
       the track in real-time, then snap on idle.
    ──────────────────────────────────────────────────────────── */
    let wheelTimer = null;

    viewport.addEventListener('wheel', (e) => {
      // Let vertical-dominant scrolls fall through to the page
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY) * 0.6) return;

      e.preventDefault();
      gsap.killTweensOf(track);

      // deltaX > 0 → fingers moved left → track moves left (x decreases)
      const newX = rubberband(x - e.deltaX, getMinX(), 0);
      gsap.set(track, { x: newX });
      x = newX;

      // Snap to nearest card once scrolling comes to rest
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => snapTo(x, 0), 140);
    }, { passive: false });

    /* ── Resize: re-clamp position ────────────────────────────── */
    window.addEventListener('resize', () => {
      x = clamp(x, getMinX(), 0);
      gsap.set(track, { x });
      updateUI();
    }, { passive: true });

    updateUI();
  })();

  /* ─────────────────────────────────────────────────────────────
     LANGUAGE TOGGLE
  ───────────────────────────────────────────────────────────── */
  document.querySelectorAll('.site-nav__lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('[role="group"]') || btn.parentElement;
      group.querySelectorAll('.site-nav__lang-btn').forEach(b => {
        b.setAttribute('aria-pressed', 'false');
        b.classList.remove('site-nav__lang-btn--active');
      });
      btn.setAttribute('aria-pressed', 'true');
      btn.classList.add('site-nav__lang-btn--active');
    });
  });

  /* ─────────────────────────────────────────────────────────────
     NEWSLETTER FORM
  ───────────────────────────────────────────────────────────── */
  const nlForm = document.querySelector('.nl-form');
  nlForm?.addEventListener('submit', e => {
    e.preventDefault();
    const input     = nlForm.querySelector('.nl-form__input');
    const feedback  = nlForm.querySelector('.nl-form__feedback');
    const submitBtn = nlForm.querySelector('.nl-form__submit');
    if (input?.value && input.validity.valid) {
      if (feedback)  { feedback.textContent = 'Merci ! Vous êtes inscrit(e).'; feedback.style.color = '#3a6b3a'; }
      if (submitBtn) submitBtn.textContent = 'Inscrit(e) ✓';
      input.value = '';
      input.disabled = true;
      if (submitBtn) submitBtn.disabled = true;
    } else {
      if (feedback)  { feedback.textContent = 'Veuillez saisir une adresse e-mail valide.'; feedback.style.color = '#a83232'; }
      input?.focus();
    }
  });

  /* ─────────────────────────────────────────────────────────────
     GSAP ANIMATIONS
  ───────────────────────────────────────────────────────────── */
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    var pre = document.getElementById('v1-preloader');
    if (pre) pre.style.display = 'none';
    document.body.style.overflow = '';
    return;
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var pre2 = document.getElementById('v1-preloader');
    if (pre2) pre2.style.display = 'none';
    document.body.style.overflow = '';
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Prevent ScrollTrigger from recalculating on every mobile resize event
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ── OWN signature: clip-path parallelogram wipe ──────────────
     polygon: closed → diagonal sliver → fully open
     Simultaneous x: -20px → 0 for the subtle pan feel.
     Source: objectswithnarratives.com @keyframes lazyanimation
  ─────────────────────────────────────────────────────────────── */
  const WIPE_CLOSED   = 'polygon(0 0, 0% 0, 0% 100%, 0 100%)';
  const WIPE_SLIVER   = 'polygon(0 0, 20% 0, 5% 100%, 0 100%)';  // diagonal leading edge
  const WIPE_OPEN     = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';

  /**
   * Attach a clip-path wipe reveal to an element.
   * will-change is set just before the animation and cleared after
   * so the browser promotes the element to a GPU compositor layer
   * only during the frames it needs it.
   */
  function wipeReveal(el, st = {}, xShift = -20) {
    const targets = typeof el === 'string' ? document.querySelectorAll(el) : [el];
    targets.forEach(target => {
      if (!target) return;
      // Promote to GPU layer — avoids CPU rasterization per frame
      target.style.willChange = 'clip-path, transform';
      gsap.set(target, { clipPath: WIPE_CLOSED, x: xShift });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: target, start: 'top 88%', once: true, ...st },
        onComplete: () => {
          target.style.willChange = 'auto'; // release layer after animation
          gsap.set(target, { clearProps: 'clipPath,x' });
        },
      });
      tl.to(target, { clipPath: WIPE_SLIVER, x: xShift,  duration: 0.3, ease: 'none' })
        .to(target, { clipPath: WIPE_OPEN,   x: 0,        duration: 0.7, ease: 'none' });
    });
  }

  /* ── OWN text reveal — direction-aware ────────────────────────
     Scrolling DOWN → text enters from y:+fromY (below)
     Scrolling UP   → text enters from y:-fromY (above)
     Exit is 2× faster than enter (0.15s vs 0.35s), like OWN.
  ─────────────────────────────────────────────────────────────── */
  function textReveal(selector, { fromY = 60, duration = 0.7, stagger = 0, delay = 0, trigger = null } = {}) {
    document.querySelectorAll(selector).forEach(el => {
      const trg = trigger || el;
      gsap.set(el, { opacity: 0, y: fromY });

      ScrollTrigger.create({
        trigger: trg,
        start: 'top 85%',
        once: true,
        onEnter: () => gsap.to(el, {
          opacity: 1, y: 0,
          duration, delay, ease: 'power3.out', overwrite: true,
        }),
      });
    });
  }

  /* ── Asymmetric hover scale ────────────────────────────────────
     OWN: 0.8s ease-in on hover, 0.3s ease-out on leave.
     The long enter makes zooming feel intentional & luxurious.
  ─────────────────────────────────────────────────────────────── */
  function hoverScale(img) {
    if (!img) return;
    img.parentElement.addEventListener('mouseenter', () =>
      gsap.to(img, { scale: 1.08, duration: 0.8, ease: 'power2.out', overwrite: true })
    );
    img.parentElement.addEventListener('mouseleave', () =>
      gsap.to(img, { scale: 1,    duration: 0.3, ease: 'power2.out', overwrite: true })
    );
  }

  /* ══════════════════════════════════════════════════════════════
     INITIAL STATES — hidden immediately so nothing flashes in
  ══════════════════════════════════════════════════════════════ */

  // Nav
  gsap.set('.site-nav__logo, .site-nav__link, .site-nav__rdv, .site-nav__burger', {
    opacity: 0, y: -16,
  });

  // Hero
  gsap.set('.hero__eyebrow', { opacity: 0, y: 80 });
  gsap.set('.hero__title',   { opacity: 0, y: 100 });
  gsap.set('.hero__content .text-link', { opacity: 0, y: 60 });
  gsap.set('.hero__scroll-indicator',   { opacity: 0 });

  /* ══════════════════════════════════════════════════════════════
     IMAGE WIPE REVEALS — clip-path parallelogram
  ══════════════════════════════════════════════════════════════ */

  // Craft split — image wipes in from left
  wipeReveal('.craft__media');

  // About — full-width image, no x shift to avoid overflow
  wipeReveal('.about__image-block', {}, 0);

  // Gallery card image wrappers — staggered batch
  (() => {
    const wraps = [...document.querySelectorAll('.gallery__card-img-wrap')];
    if (!wraps.length) return;
    // Promote all wrappers to GPU layers upfront
    wraps.forEach(w => {
      w.style.willChange = 'clip-path, transform';
      gsap.set(w, { clipPath: WIPE_CLOSED, x: -20 });
    });
    ScrollTrigger.create({
      trigger: '.gallery__viewport',
      start:   'top 88%',
      once:    true,
      onEnter: () => {
        wraps.forEach((w, i) => {
          const tl = gsap.timeline({
            delay: i * 0.12,
            onComplete: () => {
              w.style.willChange = 'auto';
              gsap.set(w, { clearProps: 'clipPath,x' });
            },
          });
          tl.to(w, { clipPath: WIPE_SLIVER, x: -20, duration: 0.3, ease: 'none' })
            .to(w, { clipPath: WIPE_OPEN,   x: 0,   duration: 0.7, ease: 'none' });
        });
      },
    });
  })();

  /* ══════════════════════════════════════════════════════════════
     TEXT SCROLL REVEALS
     (direction-aware via textReveal helper)
  ══════════════════════════════════════════════════════════════ */

  // ── Craft section ─────────────────────────────────────────────
  (() => {
    const content = document.querySelector('.craft__content');
    if (!content) return;
    [...content.children].forEach((child, i) => {
      gsap.set(child, { opacity: 0, y: 50 });
      ScrollTrigger.create({
        trigger: content, start: 'top 80%', once: true,
        onEnter: () => gsap.to(child, {
          opacity: 1, y: 0,
          duration: 0.75, delay: i * 0.15, ease: 'power3.out',
        }),
      });
    });
  })();

  // ── Statement ─────────────────────────────────────────────────
  gsap.set('.statement__text', { opacity: 0, y: 70 });
  ScrollTrigger.create({
    trigger: '.statement', start: 'top 78%', once: true,
    onEnter: () => gsap.to('.statement__text', { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' }),
  });
  gsap.set('.statement__inner .text-link', { opacity: 0, y: 30 });
  ScrollTrigger.create({
    trigger: '.statement', start: 'top 78%', once: true,
    onEnter: () => gsap.to('.statement__inner .text-link', { opacity: 1, y: 0, duration: 0.7, delay: 0.35, ease: 'power2.out' }),
  });

  // ── Gallery header ────────────────────────────────────────────
  gsap.set('.gallery__header', { opacity: 0, y: 30 });
  ScrollTrigger.create({
    trigger: '.gallery', start: 'top 85%', once: true,
    onEnter: () => gsap.to('.gallery__header', { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out' }),
  });

  // Gallery card text info — reveals after the wipe (delayed)
  (() => {
    const infos = [...document.querySelectorAll('.gallery__card-info')];
    infos.forEach(info => gsap.set(info, { opacity: 0, y: 20 }));
    ScrollTrigger.create({
      trigger: '.gallery__viewport', start: 'top 88%', once: true,
      onEnter: () => {
        infos.forEach((info, i) => gsap.to(info, {
          opacity: 1, y: 0,
          duration: 0.55, delay: 0.85 + i * 0.1, ease: 'power2.out',
        }));
      },
    });
  })();

  // ── Services ──────────────────────────────────────────────────
  gsap.set('.services__header', { opacity: 0, y: 30 });
  ScrollTrigger.create({
    trigger: '.services', start: 'top 85%', once: true,
    onEnter: () => gsap.to('.services__header', { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out' }),
  });

  // Service rows: slide in from left — like OWN's section reveals
  (() => {
    const rows = [...document.querySelectorAll('.service-row')];
    rows.forEach(row => gsap.set(row, { opacity: 0, x: -50 }));
    ScrollTrigger.create({
      trigger: '.services__list', start: 'top 82%', once: true,
      onEnter: () => {
        rows.forEach((row, i) => gsap.to(row, {
          opacity: 1, x: 0,
          duration: 0.8, delay: i * 0.18, ease: 'power3.out',
        }));
      },
    });
  })();

  // ── About ─────────────────────────────────────────────────────
  // Image caption on the about photo
  gsap.set('.about__img-caption', { opacity: 0 });
  ScrollTrigger.create({
    trigger: '.about__image-block', start: 'top 85%', once: true,
    onEnter: () => gsap.to('.about__img-caption', { opacity: 1, duration: 1.2, delay: 0.9, ease: 'power1.out' }),
  });

  // About content — two columns staggered
  (() => {
    const cols = [...document.querySelectorAll('.about__text-col, .about__data-col')];
    cols.forEach((col, i) => {
      gsap.set(col, { opacity: 0, y: 50 });
      ScrollTrigger.create({
        trigger: '.about__content', start: 'top 80%', once: true,
        onEnter: () => gsap.to(col, {
          opacity: 1, y: 0,
          duration: 0.85, delay: i * 0.2, ease: 'power3.out',
        }),
      });
    });
  })();

  // Stats — stagger each stat block
  (() => {
    const stats = [...document.querySelectorAll('.about__stat')];
    stats.forEach(s => gsap.set(s, { opacity: 0, y: 30 }));
    ScrollTrigger.create({
      trigger: '.about__stats', start: 'top 85%', once: true,
      onEnter: () => {
        stats.forEach((s, i) => gsap.to(s, {
          opacity: 1, y: 0,
          duration: 0.65, delay: i * 0.12, ease: 'power2.out',
        }));
      },
    });
  })();

  // ── Contact ───────────────────────────────────────────────────
  (() => {
    const nlChildren = [...document.querySelectorAll('.contact-newsletter > *')];
    nlChildren.forEach(c => gsap.set(c, { opacity: 0, y: 40 }));
    ScrollTrigger.create({
      trigger: '.contact-section', start: 'top 80%', once: true,
      onEnter: () => {
        nlChildren.forEach((c, i) => gsap.to(c, {
          opacity: 1, y: 0,
          duration: 0.7, delay: i * 0.12, ease: 'power2.out',
        }));
      },
    });
  })();

  gsap.set('.contact-info', { opacity: 0, y: 40 });
  ScrollTrigger.create({
    trigger: '.contact-section', start: 'top 80%', once: true,
    onEnter: () => gsap.to('.contact-info', { opacity: 1, y: 0, duration: 0.7, delay: 0.25, ease: 'power2.out' }),
  });

  // ── Footer ────────────────────────────────────────────────────
  (() => {
    const ftCols = [...document.querySelectorAll('.site-footer__brand, .site-footer__nav-col, .site-footer__social-block')];
    ftCols.forEach(c => gsap.set(c, { opacity: 0, y: 20 }));
    ScrollTrigger.create({
      trigger: '.site-footer', start: 'top 92%', once: true,
      onEnter: () => {
        ftCols.forEach((c, i) => gsap.to(c, {
          opacity: 1, y: 0,
          duration: 0.6, delay: i * 0.08, ease: 'power2.out',
        }));
      },
    });
  })();

  /* ══════════════════════════════════════════════════════════════
     HOVER — asymmetric scale
     OWN: cubic-bezier(0, 0.6, 1, 1) ≈ power2.out
     Slow in (0.8s), fast out (0.3s) — feels deliberate & luxurious
  ══════════════════════════════════════════════════════════════ */

  // Gallery card images
  document.querySelectorAll('.gallery__card-img').forEach(hoverScale);

  // Craft image
  hoverScale(document.querySelector('.craft__img'));

  /* ══════════════════════════════════════════════════════════════
     PRELOADER — fires entrance animations after images are loaded
  ══════════════════════════════════════════════════════════════ */
  v1InitPreloader(function() {
    // Nav entrance
    gsap.to('.site-nav__logo, .site-nav__link, .site-nav__rdv, .site-nav__burger', {
      opacity: 1, y: 0,
      duration: 0.7, stagger: 0.07, ease: 'power2.out', delay: 0.15,
    });

    // Hero entrance — stagger caption → title → CTA
    gsap.to('.hero__eyebrow', { opacity: 1, y: 0, duration: 0.6,  ease: 'power3.out', delay: 0.5  });
    gsap.to('.hero__title',   { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', delay: 0.65 });
    gsap.to('.hero__content .text-link', { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out', delay: 0.9  });
    gsap.to('.hero__scroll-indicator',   { opacity: 0.45, duration: 1, ease: 'power1.out', delay: 1.4 });

    ScrollTrigger.refresh();
  });

});

