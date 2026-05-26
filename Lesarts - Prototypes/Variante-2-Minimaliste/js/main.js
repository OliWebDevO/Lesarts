/* ── PRELOADER ─────────────────────────────────────────── */
function v2InitPreloader(onReady) {
  var overlay = document.getElementById('v2-preloader');
  var fill    = document.getElementById('v2-fill');
  var pctEl   = document.getElementById('v2-pct');

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
    if (pctEl) pctEl.textContent = String(p);
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
  // Browsers download images (load event) but decode lazily —
  // the first-paint decode causes a visible pop even after the preloader.
  // img.decode() forces the browser to fully decode each image to a
  // GPU-ready bitmap before the page is revealed.
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
      setTimeout(tick, 0);
    } else if (img.complete && img.naturalWidth > 0) {
      afterLoadAndDecode(img); // already downloaded — still decode
    } else {
      img.addEventListener('load',  function() { afterLoadAndDecode(img); }, { once: true });
      img.addEventListener('error', tick, { once: true });
    }
  });
}

/**
 * LES ARTS — Variante 2 : Minimaliste & Chic
 * main.js — Core interactions
 *
 * Features:
 *   1. Scroll progress bar
 *   2. Nav scroll state (transparent → white)
 *   3. Mobile menu (overlay)
 *   4. Services accordion
 *   5. Newsletter form validation
 *
 * No GSAP — animations handled by a separate agent.
 * All data-animate attributes are set for future animation binding.
 */

'use strict';

/* ============================================================
   1. SCROLL PROGRESS BAR
   ============================================================ */

function initScrollProgress() {
  const bar = document.querySelector('.scroll-progress');
  if (!bar) return;

  function updateProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = `${Math.min(progress, 100)}%`;
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
}

/* ============================================================
   2. NAV — Scroll state
   ============================================================ */

function initNavScroll() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  const SCROLL_THRESHOLD = 60;

  function updateNav() {
    if (window.scrollY > SCROLL_THRESHOLD) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();
}

/* ============================================================
   3. MOBILE MENU
   ============================================================ */

function initMobileMenu() {
  const hamburger = document.querySelector('.nav__hamburger');
  const overlay = document.querySelector('.nav__overlay');
  const overlayLinks = overlay ? overlay.querySelectorAll('.nav__overlay-link') : [];

  if (!hamburger || !overlay) return;

  let isOpen = false;

  function openMenu() {
    isOpen = true;
    hamburger.setAttribute('aria-expanded', 'true');
    overlay.classList.add('nav__overlay--open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('body--menu-open');

    // Move focus to first overlay link
    if (overlayLinks.length > 0) {
      overlayLinks[0].focus();
    }
  }

  function closeMenu() {
    isOpen = false;
    hamburger.setAttribute('aria-expanded', 'false');
    overlay.classList.remove('nav__overlay--open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('body--menu-open');
    hamburger.focus();
  }

  function toggleMenu() {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  hamburger.addEventListener('click', toggleMenu);

  // Close on overlay link click
  overlayLinks.forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) {
      closeMenu();
    }
  });

  // Focus trap within overlay
  overlay.addEventListener('keydown', function (e) {
    if (!isOpen || e.key !== 'Tab') return;

    const focusable = Array.from(overlay.querySelectorAll(
      'a[href], button, [tabindex]:not([tabindex="-1"])'
    )).filter(function (el) {
      return !el.closest('[aria-hidden="true"]');
    });

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}

/* ============================================================
   4. SERVICES ACCORDION
   ============================================================ */

function initServicesAccordion() {
  const items = document.querySelectorAll('.services__item');

  items.forEach(function (item) {
    const header = item.querySelector('.services__item-header');
    const body = item.querySelector('.services__item-body');
    if (!header || !body) return;

    const id = header.id || `service-${Math.random().toString(36).slice(2, 7)}`;
    const bodyId = `${id}-body`;

    header.setAttribute('aria-expanded', 'false');
    header.setAttribute('aria-controls', bodyId);
    body.setAttribute('id', bodyId);
    body.setAttribute('role', 'region');

    header.addEventListener('click', function () {
      const isOpen = item.classList.contains('services__item--open');

      // Close all
      items.forEach(function (other) {
        const otherHeader = other.querySelector('.services__item-header');
        other.classList.remove('services__item--open');
        if (otherHeader) {
          otherHeader.setAttribute('aria-expanded', 'false');
        }
      });

      // Toggle current
      if (!isOpen) {
        item.classList.add('services__item--open');
        header.setAttribute('aria-expanded', 'true');
      }
    });

    // Keyboard: Enter and Space already trigger click on buttons
  });
}

/* ============================================================
   5. NEWSLETTER FORM VALIDATION
   ============================================================ */

function initNewsletterForm() {
  const form = document.querySelector('.contact__form');
  if (!form) return;

  const input = form.querySelector('.contact__form-input');
  const errorEl = form.querySelector('.contact__form-error');
  const successEl = form.querySelector('.contact__form-success');

  if (!input || !errorEl || !successEl) return;

  function showError(message) {
    errorEl.textContent = message;
    errorEl.classList.add('contact__form-error--visible');
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', errorEl.id);
  }

  function clearError() {
    errorEl.classList.remove('contact__form-error--visible');
    errorEl.textContent = '';
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearError();

    const email = input.value.trim();

    if (!email) {
      showError('Veuillez saisir votre adresse e-mail.');
      input.focus();
      return;
    }

    if (!isValidEmail(email)) {
      showError('Veuillez saisir une adresse e-mail valide.');
      input.focus();
      return;
    }

    // Simulate success (no backend)
    form.classList.add('contact__form--hidden');
    successEl.classList.add('contact__form-success--visible');
  });

  // Live validation on blur
  input.addEventListener('blur', function () {
    if (input.value.trim() && !isValidEmail(input.value.trim())) {
      showError('Veuillez saisir une adresse e-mail valide.');
    } else {
      clearError();
    }
  });
}

/* ============================================================
   INIT
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  initScrollProgress();
  initNavScroll();
  initMobileMenu();
  initServicesAccordion();
  initNewsletterForm();
});

/* ============================================================
   GSAP ANIMATIONS
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* ----------------------------------------------------------
     Guard: skip all animations if GSAP is not loaded
  ---------------------------------------------------------- */
  if (typeof gsap === 'undefined') {
    var preEl = document.getElementById('v2-preloader');
    if (preEl) preEl.style.display = 'none';
    document.body.style.overflow = '';
    return;
  }

  /* ----------------------------------------------------------
     Register plugins
     SplitText is a GSAP Club plugin — guard against it being
     unavailable on public CDNs so hero text never stays hidden.
  ---------------------------------------------------------- */
  const hasSplitText = typeof SplitText !== 'undefined';

  if (hasSplitText) {
    gsap.registerPlugin(ScrollTrigger, SplitText);
  } else {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ----------------------------------------------------------
     prefers-reduced-motion: skip everything if user opted out
  ---------------------------------------------------------- */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    // Make everything immediately visible — no animations
    gsap.set('[data-animate]', { clearProps: 'all' });
    var pre2 = document.getElementById('v2-preloader');
    if (pre2) pre2.style.display = 'none';
    document.body.style.overflow = '';
    return;
  }

  /* ==========================================================
     HERO — Page load sequence
     Timeline starts immediately on load.
  ========================================================== */

  const heroTl = gsap.timeline({ defaults: { ease: 'expo.out' }, paused: true });

  /* --- hero-number: horizontal wipe-in via clip-path --- */
  const heroNumber = document.querySelector('[data-animate="hero-number"]');
  if (heroNumber) {
    gsap.set(heroNumber, { clipPath: 'inset(0 100% 0 0)' });
    heroTl.to(heroNumber, {
      clipPath: 'inset(0 0% 0 0)',
      duration: 1.0
    }, 0.2); // start 0.2s in — tiny breathing room after paint
  }

  /* --- hero-line-1: word-by-word reveal (requires SplitText) --- */
  const heroLine1 = document.querySelector('[data-animate="hero-line-1"]');
  if (heroLine1) {
    if (hasSplitText) {
      // overflow: hidden is set in CSS on [data-animate="hero-line-1"] — no inline style needed
      const split1 = new SplitText(heroLine1, { type: 'words' });
      gsap.set(split1.words, { opacity: 0, y: 30 });

      heroTl.to(split1.words, {
        opacity: 1,
        y: 0,
        stagger: 0.08,
        duration: 1.0,
        ease: 'expo.out'
      }, '-=0.5'); // overlaps with wipe ending
    } else {
      // Fallback: simple fade-in without SplitText
      gsap.set(heroLine1, { opacity: 0, y: 20 });
      heroTl.to(heroLine1, { opacity: 1, y: 0, duration: 1.0 }, '-=0.5');
    }
  }

  /* --- hero-line-2: word-by-word reveal (requires SplitText) --- */
  const heroLine2 = document.querySelector('[data-animate="hero-line-2"]');
  if (heroLine2) {
    if (hasSplitText) {
      // overflow: hidden is set in CSS on [data-animate="hero-line-2"] — no inline style needed
      const split2 = new SplitText(heroLine2, { type: 'words' });
      gsap.set(split2.words, { opacity: 0, y: 30 });

      heroTl.to(split2.words, {
        opacity: 1,
        y: 0,
        stagger: 0.1,
        duration: 1.0,
        ease: 'expo.out'
      }, '-=0.35'); // begins before line-1 fully completes — fluid, not mechanical
    } else {
      // Fallback: simple fade-in without SplitText
      gsap.set(heroLine2, { opacity: 0, y: 20 });
      heroTl.to(heroLine2, { opacity: 1, y: 0, duration: 1.0 }, '-=0.35');
    }
  }

  /* --- nav: fades in after the hero text has landed --- */
  const nav = document.querySelector('[data-animate="nav"]');
  if (nav) {
    gsap.set(nav, { opacity: 0 });
    heroTl.to(nav, {
      opacity: 1,
      duration: 1.0,
      ease: 'power3.out'
    }, 1.8); // absolute position — always 1.8s from timeline start
  }

  /* ==========================================================
     GALLERY IMAGE — Curtain reveal + subtle scale
  ========================================================== */

  const galleryImage = document.querySelector('[data-animate="gallery-image"]');
  if (galleryImage) {
    gsap.set(galleryImage, {
      scale: 1.08,
      clipPath: 'inset(8% 0)'
    });

    ScrollTrigger.create({
      trigger: galleryImage,
      start: 'top 80%',
      toggleActions: 'play none none none',
      onEnter: function () {
        gsap.to(galleryImage, {
          scale: 1.0,
          clipPath: 'inset(0% 0)',
          duration: 1.4,
          ease: 'expo.out'
        });
      }
    });
  }

  /* ==========================================================
     SERVICES — Accordion row reveal from left + border scaleX
  ========================================================== */

  const serviceHeaders = document.querySelectorAll('.services__item-header');
  if (serviceHeaders.length > 0) {
    gsap.set(serviceHeaders, { x: -40, opacity: 0 });

    ScrollTrigger.create({
      trigger: '.services__list',
      start: 'top 80%',
      toggleActions: 'play none none none',
      onEnter: function () {
        gsap.to(serviceHeaders, {
          x: 0,
          opacity: 1,
          stagger: 0.25,
          duration: 0.9,
          ease: 'power3.out'
        });

        // Border lines: scaleX 0 → 1, slightly after each row's own animation
        const borders = document.querySelectorAll('.services__item-border');
        if (borders.length > 0) {
          gsap.set(borders, { scaleX: 0, transformOrigin: 'left center' });
          gsap.to(borders, {
            scaleX: 1,
            stagger: 0.25,
            duration: 0.7,
            ease: 'power3.out',
            delay: 0.2
          });
        }
      }
    });
  }

  /* ==========================================================
     REALISATIONS — Grid images: opacity + y reveal
  ========================================================== */

  // Réalisations grid — no scroll animation, images are visible immediately

  /* ==========================================================
     PROCESS STEPS — Stagger from left
  ========================================================== */

  const processSteps = document.querySelectorAll('[data-animate="process-step"]');
  if (processSteps.length > 0) {
    gsap.set(processSteps, { x: -30, opacity: 0 });

    ScrollTrigger.create({
      trigger: '.process__steps',
      start: 'top 80%',
      toggleActions: 'play none none none',
      onEnter: function () {
        gsap.to(processSteps, {
          x: 0,
          opacity: 1,
          stagger: 0.3,
          duration: 0.9,
          ease: 'power3.out'
        });
      }
    });
  }

  /* ==========================================================
     QUOTE — Word-by-word SplitText reveal
  ========================================================== */

  const quoteEl = document.querySelector('[data-animate="quote"]');
  if (quoteEl) {
    if (hasSplitText) {
      const splitQuote = new SplitText(quoteEl, { type: 'words' });
      gsap.set(splitQuote.words, { opacity: 0, y: 20 });

      ScrollTrigger.create({
        trigger: quoteEl,
        start: 'top 80%',
        toggleActions: 'play none none none',
        onEnter: function () {
          gsap.to(splitQuote.words, {
            opacity: 1,
            y: 0,
            stagger: 0.04,
            duration: 0.7,
            ease: 'power2.out'
          });
        }
      });
    } else {
      // Fallback: fade-in the whole quote
      gsap.set(quoteEl, { opacity: 0, y: 20 });
      ScrollTrigger.create({
        trigger: quoteEl,
        start: 'top 80%',
        toggleActions: 'play none none none',
        onEnter: function () {
          gsap.to(quoteEl, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' });
        }
      });
    }
  }

  /* ==========================================================
     ATELIER IMAGE — Parallax scrub
  ========================================================== */

  const atelierImage = document.querySelector('[data-animate="atelier-image"]');
  if (atelierImage) {
    gsap.fromTo(atelierImage,
      { y: 40 },
      {
        y: -40,
        ease: 'none',
        scrollTrigger: {
          trigger: '.atelier',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
          invalidateOnRefresh: true
        }
      }
    );
  }

  /* ==========================================================
     SECTION NUMBERS — CountUp as section enters viewport
     Targets .section-header__number elements: "02", "03", "04", "05"
  ========================================================== */

  const sectionNumbers = document.querySelectorAll('.section-header__number');

  sectionNumbers.forEach(function (el) {
    const targetValue = parseInt(el.textContent, 10);
    if (isNaN(targetValue)) return;

    // Proxy object for GSAP to tween
    const proxy = { val: 0 };

    // Set initial display to "00"
    el.textContent = '00';

    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      toggleActions: 'play none none none',
      onEnter: function () {
        gsap.to(proxy, {
          val: targetValue,
          duration: 1.2,
          ease: 'power2.out',
          onUpdate: function () {
            // Format as zero-padded two-digit number to match design
            el.textContent = String(Math.round(proxy.val)).padStart(2, '0');
          }
        });
      }
    });
  });

  /* ==========================================================
     FINAL REFRESH
  ========================================================== */

  /* ── PRELOADER: play entrance after images load ─────────── */
  v2InitPreloader(function() {
    heroTl.play();
    ScrollTrigger.refresh();
  });

});
