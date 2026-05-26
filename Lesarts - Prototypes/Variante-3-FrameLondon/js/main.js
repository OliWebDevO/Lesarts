/* ── PRELOADER ─────────────────────────────────────────── */
function v3InitPreloader(onReady) {
  var overlay = document.getElementById('v3-preloader');
  var fill    = document.getElementById('v3-fill');
  var pctEl   = document.getElementById('v3-pct');

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

  images.forEach(function(img) {
    // Force eager — lazy images below fold never fire 'load'
    // while the preloader blocks scrolling
    if (img.loading === 'lazy') img.loading = 'eager';

    if (!img.src && !img.srcset) {
      setTimeout(tick, 0);
    } else if (img.complete && img.naturalWidth > 0) {
      setTimeout(tick, 0);
    } else {
      img.addEventListener('load',  tick, { once: true });
      img.addEventListener('error', tick, { once: true });
    }
  });
}

/**
 * Les Arts — Variante 3: Frame London Inspired
 * main.js
 *
 * Responsibilities:
 *   1. Sticky navigation (transparent → cream on scroll)
 *   2. Mobile menu (open / close / keyboard / focus trap)
 *   3. Testimonial slider (prev/next/dots, keyboard accessible)
 *   4. Newsletter form validation
 *
 * No GSAP — data-animate attributes are reserved for the animation agent.
 * No external dependencies.
 */

(function () {
  'use strict';

  /* ============================================================
     UTILITY: safely query DOM elements
  ============================================================ */
  function qs(selector, context) {
    return (context || document).querySelector(selector);
  }

  function qsa(selector, context) {
    return Array.from((context || document).querySelectorAll(selector));
  }


  /* ============================================================
     1. STICKY NAVIGATION
     Adds .is-scrolled to <header> once page scrolls past 60px.
  ============================================================ */
  (function initStickyNav() {
    var header = qs('#site-header');
    if (!header) return;

    var SCROLL_THRESHOLD = 60;

    function onScroll() {
      if (window.scrollY > SCROLL_THRESHOLD) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    }

    // Passive listener for performance
    window.addEventListener('scroll', onScroll, { passive: true });

    // Run once on init in case page is loaded mid-scroll
    onScroll();
  })();


  /* ============================================================
     2. MOBILE MENU
     Opens/closes full-screen overlay. Traps focus. Closes on:
       - close button (hamburger toggle)
       - Escape key
       - clicking a menu link
  ============================================================ */
  (function initMobileMenu() {
    var header      = qs('#site-header');
    var hamburger   = qs('#nav-hamburger');
    var mobileMenu  = qs('#mobile-menu');

    if (!hamburger || !mobileMenu) return;

    // All focusable elements inside the menu for focus trapping
    var focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    function getFocusableElements() {
      return qsa(focusableSelectors, mobileMenu);
    }

    function openMenu() {
      mobileMenu.removeAttribute('hidden');
      hamburger.setAttribute('aria-expanded', 'true');
      hamburger.setAttribute('aria-label', 'Fermer le menu');
      hamburger.classList.add('is-open');
      document.body.classList.add('menu-open');

      // Focus first focusable element after transition
      setTimeout(function () {
        var focusable = getFocusableElements();
        if (focusable.length) focusable[0].focus();
      }, 350);
    }

    function closeMenu() {
      mobileMenu.setAttribute('hidden', '');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'Ouvrir le menu');
      hamburger.classList.remove('is-open');
      document.body.classList.remove('menu-open');
      hamburger.focus();
    }

    function isMenuOpen() {
      return !mobileMenu.hasAttribute('hidden');
    }

    // Toggle on hamburger click
    hamburger.addEventListener('click', function () {
      if (isMenuOpen()) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isMenuOpen()) {
        closeMenu();
      }
    });

    // Focus trap inside mobile menu
    mobileMenu.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;

      var focusable = getFocusableElements();
      if (!focusable.length) return;

      var firstEl = focusable[0];
      var lastEl  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if on first element, wrap to last
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        // Tab: if on last element, wrap to first
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    });

    // Close menu when a nav link is clicked
    qsa('.mobile-menu__link', mobileMenu).forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
  })();


  /* ============================================================
     3. TESTIMONIAL SLIDER
     Vanilla JS slider with:
       - Prev / Next buttons
       - Dot navigation
       - Keyboard arrow key support
       - aria-live region for screen readers
  ============================================================ */
  (function initTestimonialSlider() {
    var slides     = qsa('.testimonials__slide');
    var dots       = qsa('.testimonials__dot');
    var prevBtn    = qs('#testimonial-prev');
    var nextBtn    = qs('#testimonial-next');
    var track      = qs('.testimonials__track');

    if (!slides.length || !prevBtn || !nextBtn) return;

    var currentIndex = 0;
    var total        = slides.length;

    function goTo(index) {
      // Clamp and wrap
      if (index < 0) index = total - 1;
      if (index >= total) index = 0;

      // Deactivate current
      slides[currentIndex].classList.remove('testimonials__slide--active');
      slides[currentIndex].setAttribute('aria-hidden', 'true');

      if (dots[currentIndex]) {
        dots[currentIndex].classList.remove('testimonials__dot--active');
        dots[currentIndex].setAttribute('aria-selected', 'false');
      }

      // Activate new
      currentIndex = index;

      slides[currentIndex].classList.add('testimonials__slide--active');
      slides[currentIndex].removeAttribute('aria-hidden');

      if (dots[currentIndex]) {
        dots[currentIndex].classList.add('testimonials__dot--active');
        dots[currentIndex].setAttribute('aria-selected', 'true');
      }
    }

    // Initialize — first slide is active, rest are hidden
    slides.forEach(function (slide, i) {
      if (i !== 0) {
        slide.setAttribute('aria-hidden', 'true');
      }
    });

    prevBtn.addEventListener('click', function () {
      goTo(currentIndex - 1);
    });

    nextBtn.addEventListener('click', function () {
      goTo(currentIndex + 1);
    });

    // Dot navigation
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var index = parseInt(dot.getAttribute('data-index'), 10);
        if (!isNaN(index)) goTo(index);
      });
    });

    // Keyboard navigation (arrow keys when slider region is focused)
    if (track) {
      track.setAttribute('tabindex', '0');
      track.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          goTo(currentIndex - 1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          goTo(currentIndex + 1);
        }
      });
    }
  })();


  /* ============================================================
     4. NEWSLETTER FORM VALIDATION
     Validates Prénom, Nom and Email fields.
     Shows inline error messages with aria-live regions.
  ============================================================ */
  (function initNewsletterForm() {
    var form = qs('#newsletter-form');
    if (!form) return;

    var fields = {
      prenom: {
        input: qs('#newsletter-prenom'),
        error: qs('#newsletter-prenom-error'),
        validate: function (val) {
          if (!val.trim()) return 'Veuillez entrer votre prénom.';
          return '';
        }
      },
      nom: {
        input: qs('#newsletter-nom'),
        error: qs('#newsletter-nom-error'),
        validate: function (val) {
          if (!val.trim()) return 'Veuillez entrer votre nom.';
          return '';
        }
      },
      email: {
        input: qs('#newsletter-email'),
        error: qs('#newsletter-email-error'),
        validate: function (val) {
          if (!val.trim()) return 'Veuillez entrer votre adresse email.';
          // Basic email pattern check
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) {
            return 'Veuillez entrer une adresse email valide.';
          }
          return '';
        }
      }
    };

    function setFieldError(field, message) {
      field.input.classList.toggle('has-error', !!message);
      field.error.textContent = message;

      if (message) {
        field.input.setAttribute('aria-describedby', field.error.id);
        field.input.setAttribute('aria-invalid', 'true');
      } else {
        field.input.removeAttribute('aria-describedby');
        field.input.setAttribute('aria-invalid', 'false');
      }
    }

    // Live validation on blur
    Object.keys(fields).forEach(function (key) {
      var field = fields[key];
      if (!field.input) return;

      field.input.addEventListener('blur', function () {
        var message = field.validate(field.input.value);
        setFieldError(field, message);
      });

      // Clear error on input
      field.input.addEventListener('input', function () {
        if (field.input.classList.contains('has-error')) {
          setFieldError(field, '');
        }
      });
    });

    // Submit validation
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var isValid = true;
      var firstErrorField = null;

      Object.keys(fields).forEach(function (key) {
        var field = fields[key];
        if (!field.input) return;

        var message = field.validate(field.input.value);
        setFieldError(field, message);

        if (message) {
          isValid = false;
          if (!firstErrorField) firstErrorField = field.input;
        }
      });

      if (!isValid) {
        // Focus first invalid field
        if (firstErrorField) firstErrorField.focus();
        return;
      }

      // Simulate successful submission
      var btn = form.querySelector('.newsletter__btn');
      if (btn) {
        btn.textContent = 'Inscription confirmée';
        btn.disabled = true;
        btn.classList.add('newsletter__btn--submitted');
      }

      // Reset form
      form.reset();

      // Announce success to screen readers
      var announcement = document.createElement('p');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.textContent = 'Votre inscription à la newsletter a bien été enregistrée.';
      announcement.style.position = 'absolute';
      announcement.style.left = '-9999px';
      document.body.appendChild(announcement);

      setTimeout(function () {
        document.body.removeChild(announcement);
      }, 5000);
    });
  })();

})();


/* ================================================================
   GSAP ANIMATIONS — Les Arts Variante 3
   All animations are scoped inside DOMContentLoaded and guarded
   by a prefers-reduced-motion check.
================================================================ */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  /* ----------------------------------------------------------
     0. REDUCED MOTION GUARD
     If the user prefers reduced motion, skip all animations.
     Content is already visible via CSS — no state to restore.
  ---------------------------------------------------------- */
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    var pre3 = document.getElementById('v3-preloader');
    if (pre3) pre3.style.display = 'none';
    document.body.style.overflow = '';
    return;
  }

  /* ----------------------------------------------------------
     REGISTER PLUGIN
  ---------------------------------------------------------- */
  gsap.registerPlugin(ScrollTrigger);

  /* ----------------------------------------------------------
     SHARED DEFAULTS
  ---------------------------------------------------------- */
  var DEFAULT_EASE    = 'power2.out';
  var DEFAULT_START   = 'top 85%';
  var DEFAULT_ACTIONS = 'play none none none';


  /* ----------------------------------------------------------
     1. NAVIGATION — fade down on page load
  ---------------------------------------------------------- */
  var navEl = document.querySelector('[data-animate="nav"]');
  if (navEl) {
    gsap.set(navEl, { opacity: 0, y: -10 });
  }


  /* ----------------------------------------------------------
     2. HERO — photo scale + quote words stagger
  ---------------------------------------------------------- */
  var heroImage = document.querySelector('.hero__image');
  if (heroImage) {
    gsap.set(heroImage, { scale: 1.06 });
  }

  /* Split the two .hero__quote-line elements into individual
     word spans, then stagger them in after the photo settles. */
  var quoteLines = document.querySelectorAll('.hero__quote-line');
  var allWordSpans = [];
  if (quoteLines.length) {
    quoteLines.forEach(function (line) {
      var words = line.textContent.trim().split(/\s+/);
      line.textContent = '';
      words.forEach(function (word, i) {
        // Space as a plain text node between spans — never stripped by CSS.
        // Putting the space inside an inline-block span causes CSS white-space
        // collapsing to remove leading whitespace, merging all words together.
        if (i > 0) {
          line.appendChild(document.createTextNode(' '));
        }
        var span = document.createElement('span');
        span.textContent = word;
        span.style.display = 'inline-block';
        line.appendChild(span);
        allWordSpans.push(span);
      });
    });
    gsap.set(allWordSpans, { opacity: 0, y: 20 });
  }


  /* ----------------------------------------------------------
     3. TESTIMONIALS — entrance of the section (first slide only)
     The slider JS controls transitions between slides; we only
     animate the initial appearance of the active slide content.
  ---------------------------------------------------------- */
  var firstSlide = document.querySelector('.testimonials__slide--active');
  if (firstSlide) {
    var testimonialQuote = firstSlide.querySelector('.testimonials__quote');
    var testimonialLine  = firstSlide.querySelector('.testimonials__attribution-line');

    if (testimonialQuote) {
      gsap.set(testimonialQuote, { opacity: 0, y: 20 });
      gsap.to(testimonialQuote, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: DEFAULT_EASE,
        scrollTrigger: {
          trigger: firstSlide,
          start: DEFAULT_START,
          toggleActions: DEFAULT_ACTIONS
        }
      });
    }

    if (testimonialLine) {
      gsap.set(testimonialLine, { scaleX: 0, transformOrigin: 'left center' });
      gsap.to(testimonialLine, {
        scaleX: 1,
        duration: 0.6,
        delay: 0.3,
        ease: DEFAULT_EASE,
        scrollTrigger: {
          trigger: firstSlide,
          start: DEFAULT_START,
          toggleActions: DEFAULT_ACTIONS
        }
      });
    }
  }


  /* ----------------------------------------------------------
     4. SPLIT IMAGES — organic fade-float reveal + inner settle
  ---------------------------------------------------------- */
  document.querySelectorAll('[data-animate="split-image"]').forEach(function (wrapper) {
    var img = wrapper.querySelector('img');

    /* Wrapper fades up from a soft offset — no hard clipping */
    gsap.set(wrapper, { opacity: 0, y: 24 });
    gsap.to(wrapper, {
      opacity: 1,
      y: 0,
      duration: 1.5,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: wrapper,
        start: DEFAULT_START,
        toggleActions: DEFAULT_ACTIONS
      }
    });

    /* Inner image scales gently inward for a cinematic settle */
    if (img) {
      gsap.set(img, { scale: 1.07 });
      gsap.to(img, {
        scale: 1,
        duration: 2.0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: wrapper,
          start: DEFAULT_START,
          toggleActions: DEFAULT_ACTIONS
        }
      });
    }
  });


  /* ----------------------------------------------------------
     5. SPLIT TEXT — stagger children of each text column
  ---------------------------------------------------------- */
  document.querySelectorAll('[data-animate="split-text"]').forEach(function (col) {
    /* Animate direct children of the inner content wrapper */
    var inner = col.querySelector('.split-gamme__content, .split-realisations__content') || col;
    var children = Array.from(inner.children);
    if (!children.length) return;

    gsap.set(children, { opacity: 0, y: 30 });
    gsap.to(children, {
      opacity: 1,
      y: 0,
      stagger: 0.12,
      duration: 0.7,
      delay: 0.2,
      ease: DEFAULT_EASE,
      scrollTrigger: {
        trigger: col,
        start: DEFAULT_START,
        toggleActions: DEFAULT_ACTIONS
      }
    });
  });


  /* ----------------------------------------------------------
     6. FULL-WIDTH BANNER — content scale + parallax on photo
  ---------------------------------------------------------- */
  /* Banner content (heading, subtitle, CTA) */
  var bannerContent = document.querySelector('[data-animate="banner-content"]');
  if (bannerContent) {
    gsap.set(bannerContent, { opacity: 0, scale: 0.96 });
    gsap.to(bannerContent, {
      opacity: 1,
      scale: 1,
      duration: 0.9,
      ease: DEFAULT_EASE,
      scrollTrigger: {
        trigger: bannerContent,
        start: DEFAULT_START,
        toggleActions: DEFAULT_ACTIONS
      }
    });
  }

  /* Parallax scrub on the banner photo */
  var bannerImage = document.querySelector('.banner__image');
  if (bannerImage) {
    gsap.fromTo(bannerImage,
      { y: 60 },
      {
        y: -60,
        ease: 'none',
        scrollTrigger: {
          trigger: '.banner',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5
        }
      }
    );
  }


  /* ----------------------------------------------------------
     7. THEMATIC COLUMNS — stagger 4 columns
  ---------------------------------------------------------- */
  var thematicCols = document.querySelectorAll('[data-animate="thematic-col"]');
  if (thematicCols.length) {
    gsap.set(thematicCols, { opacity: 0, y: 30 });
    gsap.to(thematicCols, {
      opacity: 1,
      y: 0,
      stagger: 0.15,
      duration: 0.6,
      ease: DEFAULT_EASE,
      scrollTrigger: {
        trigger: thematicCols[0],
        start: DEFAULT_START,
        toggleActions: DEFAULT_ACTIONS
      }
    });
  }


  /* ----------------------------------------------------------
     8. SERVICE ITEMS — per-item entrance + SVG draw animation
  ---------------------------------------------------------- */
  document.querySelectorAll('[data-animate="service-item"]').forEach(function (item) {
    var svgContainer = item.querySelector('[data-service-svg]');
    var drawEls = svgContainer
      ? Array.from(svgContainer.querySelectorAll('[class]'))
      : [];

    /* Init SVG paths invisible */
    drawEls.forEach(function (el) {
      if (!el.getTotalLength) return;
      var len = el.getTotalLength();
      if (len <= 0) return;
      gsap.set(el, { strokeDasharray: len, strokeDashoffset: len });
    });

    /* Item starts hidden */
    gsap.set(item, { opacity: 0, y: 20 });

    /* Timeline per item */
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: item,
        start: DEFAULT_START,
        toggleActions: DEFAULT_ACTIONS
      }
    });

    /* Fade in item */
    tl.to(item, {
      opacity: 1,
      y: 0,
      duration: 0.65,
      ease: DEFAULT_EASE
    });

    /* Draw SVG paths, staggered, starting at 0.25 s */
    drawEls.forEach(function (el, i) {
      if (!el.getTotalLength) return;
      var len = el.getTotalLength();
      if (len <= 0) return;
      tl.to(el, {
        strokeDashoffset: 0,
        duration: 2.4,
        ease: 'power2.inOut'
      }, 0.25 + i * 0.1);
    });
  });


  /* ----------------------------------------------------------
     9. PROCESS — header entrance + per-step SVG draw animation
  ---------------------------------------------------------- */
  (function initProcessAnimations() {
    var processSection = document.querySelector('.process');
    if (!processSection) return;

    /* Header: label + heading stagger */
    var processHeader = processSection.querySelector('.process__header');
    if (processHeader) {
      var headerKids = Array.from(processHeader.children);
      gsap.set(headerKids, { opacity: 0, y: 20 });
      gsap.to(headerKids, {
        opacity: 1,
        y: 0,
        stagger: 0.12,
        duration: 0.7,
        ease: DEFAULT_EASE,
        scrollTrigger: {
          trigger: processHeader,
          start: DEFAULT_START,
          toggleActions: DEFAULT_ACTIONS
        }
      });
    }

    /* All steps animate simultaneously on a single trigger */
    var processSteps = Array.from(processSection.querySelectorAll('.process__step'));
    var stepData = processSteps.map(function (step) {
      var svgContainer = step.querySelector('[data-step-svg]');
      var drawEls = svgContainer
        ? Array.from(svgContainer.querySelectorAll('[class]'))
        : [];

      /* Set each stroke path invisible via dasharray/dashoffset */
      drawEls.forEach(function (el) {
        if (!el.getTotalLength) return;
        var len = el.getTotalLength();
        if (len <= 0) return;
        gsap.set(el, { strokeDasharray: len, strokeDashoffset: len });
      });

      /* Step starts hidden */
      gsap.set(step, { opacity: 0, y: 32 });

      return { step: step, drawEls: drawEls };
    });

    /* Single ScrollTrigger on the whole steps container — fires all at once */
    var processStepsContainer = processSection.querySelector('.process__steps');
    ScrollTrigger.create({
      trigger: processStepsContainer || processSection,
      start: DEFAULT_START,
      toggleActions: DEFAULT_ACTIONS,
      onEnter: function () {
        stepData.forEach(function (data) {
          var tl = gsap.timeline();

          /* 1. Step fades in */
          tl.to(data.step, {
            opacity: 1,
            y: 0,
            duration: 0.65,
            ease: DEFAULT_EASE
          });

          /* 2. Length-normalised draw — every stroke ends at the same absolute
                moment (END_AT). The longest path in the step gets the full
                DRAW_DURATION and starts first. Shorter paths get a proportionally
                shorter duration and start later so they still land on END_AT.
                All paths draw at the same px/s rate; the step with more/longer
                strokes is never slower because shorter paths simply start later
                and draw faster. */
          var DRAW_DURATION = 2.0;
          var END_AT        = 0.25 + DRAW_DURATION;

          /* Find the longest individual path in this step */
          var maxLen = 0;
          data.drawEls.forEach(function (el) {
            if (!el.getTotalLength) return;
            var l = el.getTotalLength();
            if (l > maxLen) maxLen = l;
          });

          data.drawEls.forEach(function (el) {
            if (!el.getTotalLength) return;
            var len = el.getTotalLength();
            if (len <= 0) return;
            var duration = maxLen > 0
              ? Math.max(DRAW_DURATION * (len / maxLen), 0.25)
              : DRAW_DURATION;
            var startAt = END_AT - duration;
            tl.to(el, {
              strokeDashoffset: 0,
              duration: duration,
              ease: 'power2.inOut'
            }, startAt);
          });
        });
      }
    });
  })();


  /* ----------------------------------------------------------
     10. NEWSLETTER — heading, subtitle and form children stagger
  ---------------------------------------------------------- */
  var newsletterInner = document.querySelector('.newsletter__inner');
  if (newsletterInner) {
    var newsletterHeading  = newsletterInner.querySelector('.newsletter__heading');
    var newsletterSubtitle = newsletterInner.querySelector('.newsletter__subtitle');
    var formFields         = Array.from(newsletterInner.querySelectorAll('.newsletter__field'));
    var submitBtn          = newsletterInner.querySelector('.newsletter__btn');

    var allNewsletterEls = [newsletterHeading, newsletterSubtitle]
      .filter(Boolean)
      .concat(formFields)
      .concat(submitBtn ? [submitBtn] : []);

    if (allNewsletterEls.length) {
      gsap.set(allNewsletterEls, { opacity: 0, y: 20 });
      gsap.to(allNewsletterEls, {
        opacity: 1,
        y: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: DEFAULT_EASE,
        scrollTrigger: {
          trigger: newsletterInner,
          start: DEFAULT_START,
          toggleActions: DEFAULT_ACTIONS
        }
      });
    }
  }


  /* ----------------------------------------------------------
     10. GENERIC H2 HEADINGS — all h2s not already animated
         above via a dedicated data-animate wrapper.
  ---------------------------------------------------------- */
  /* Build a Set of already-covered h2 nodes */
  var coveredH2Set = new Set();
  [
    '[data-animate="banner-content"] h2',
    '[data-animate="split-text"] h2',
    '.newsletter__heading',
    '.process__heading'
  ].forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      coveredH2Set.add(el);
    });
  });

  /* services__heading sits outside any data-animate wrapper */
  var servicesHeading = document.querySelector('.services__heading');
  if (servicesHeading) {
    coveredH2Set.add(servicesHeading);
    gsap.set(servicesHeading, { opacity: 0, y: 25 });
    gsap.to(servicesHeading, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: DEFAULT_EASE,
      scrollTrigger: {
        trigger: servicesHeading,
        start: DEFAULT_START,
        toggleActions: DEFAULT_ACTIONS
      }
    });
  }

  document.querySelectorAll('h2').forEach(function (h2) {
    if (coveredH2Set.has(h2)) return;

    gsap.set(h2, { opacity: 0, y: 25 });
    gsap.to(h2, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: DEFAULT_EASE,
      scrollTrigger: {
        trigger: h2,
        start: DEFAULT_START,
        toggleActions: DEFAULT_ACTIONS
      }
    });
  });


  /* ── PRELOADER: fire entrance animations after images load ── */
  v3InitPreloader(function() {
    // Nav entrance
    if (navEl) {
      gsap.to(navEl, { opacity: 1, y: 0, duration: 0.8, delay: 0.4, ease: DEFAULT_EASE });
    }

    // Hero image settle
    if (heroImage) {
      gsap.to(heroImage, { scale: 1, duration: 1.8, ease: DEFAULT_EASE });
    }

    // Hero words stagger
    if (allWordSpans.length) {
      gsap.to(allWordSpans, {
        opacity: 1, y: 0,
        duration: 0.8, delay: 0.8, stagger: 0.06, ease: DEFAULT_EASE
      });
    }

    /* ----------------------------------------------------------
       11. FINAL REFRESH
       Called once after all triggers are registered so
       ScrollTrigger can accurately calculate positions.
    ---------------------------------------------------------- */
    ScrollTrigger.refresh();
  });

});
