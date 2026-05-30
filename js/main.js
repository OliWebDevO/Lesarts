/* ============================================
   LESARTS — Main JS
   Animations & interactions — vanilla JS + GSAP
   ============================================ */

'use strict';

/* ============================================
   GSAP PLUGIN REGISTRATION
   ============================================ */
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

/* ============================================
   REDUCED MOTION CHECK
   ============================================ */
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================
   1. LENIS SMOOTH SCROLL
   ============================================ */
function initSmoothScroll() {
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

/* ============================================
   2. PAGE LOADER
   ============================================ */
function initPageLoader() {
  const loader = document.getElementById('page-loader');
  const fill   = document.getElementById('loader-fill');
  const pctEl  = document.getElementById('loader-pct');

  document.body.style.overflow = 'hidden';

  if (!loader) { document.body.style.overflow = ''; return; }

  if (prefersReduced) {
    loader.style.display = 'none';
    document.body.style.overflow = '';
    return;
  }

  const MIN_MS = 600;
  const start  = Date.now();
  const images = Array.from(document.images);
  let done     = 0;
  const total  = images.length;
  let safetyTimer;

  function dismiss() {
    clearTimeout(safetyTimer);
    document.body.style.overflow = '';
    gsap.to(loader, {
      clipPath: 'inset(0 0 100% 0)',
      duration: 1.1,
      ease: 'power4.inOut',
      onComplete: () => { loader.style.display = 'none'; },
    });
  }

  if (!total) { safetyTimer = setTimeout(dismiss, MIN_MS); return; }

  function tick() {
    done = Math.min(done + 1, total);
    const p = Math.round((done / total) * 100);
    if (fill)  fill.style.width  = p + '%';
    if (pctEl) pctEl.textContent = p + '%';
    loader.setAttribute('aria-valuenow', p);
    if (done >= total) {
      clearTimeout(safetyTimer);
      const wait = Math.max(0, MIN_MS - (Date.now() - start));
      setTimeout(dismiss, wait);
    }
  }

  // Safety valve — dismiss after 10 s regardless of network
  safetyTimer = setTimeout(() => { done = total; dismiss(); }, 10000);

  images.forEach(img => {
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

/* ============================================
   3. CUSTOM CURSOR
   ============================================ */
function initCustomCursor() {
  if (prefersReduced) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const cursor = document.getElementById('cursor');
  const follower = document.getElementById('cursor-follower');
  if (!cursor || !follower) return;

  const pos = { x: 0, y: 0 };
  const mouse = { x: 0, y: 0 };

  document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  // Hover effects on interactive elements
  function addHoverEffects() {
    document.querySelectorAll('a, button, [role="button"]').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        gsap.to(follower, { scale: 2.5, opacity: 0.15, duration: 0.4, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(follower, { scale: 1, opacity: 0.3, duration: 0.4, ease: 'power3.out' });
      });
    });
  }

  addHoverEffects();

  const tick = () => {
    pos.x += (mouse.x - pos.x) * 0.15;
    pos.y += (mouse.y - pos.y) * 0.15;
    gsap.set(cursor, { x: mouse.x, y: mouse.y });
    gsap.set(follower, { x: pos.x, y: pos.y });
  };

  gsap.ticker.add(tick);
}

/* ============================================
   4. HEADER MENU
   ============================================ */
function initHeader() {
  const burgerBtn = document.getElementById('burger-btn');
  const navOverlay = document.getElementById('nav-overlay');
  if (!burgerBtn || !navOverlay) return;

  let menuOpen = false;

  function toggleMenu() {
    menuOpen = !menuOpen;
    burgerBtn.classList.toggle('is-open', menuOpen);
    navOverlay.classList.toggle('is-open', menuOpen);
    burgerBtn.setAttribute('aria-expanded', menuOpen ? 'true' : 'false');
    navOverlay.setAttribute('aria-hidden', menuOpen ? 'false' : 'true');
    burgerBtn.querySelector('.burger-label').textContent = menuOpen ? 'Fermer' : 'Menu';
  }

  burgerBtn.addEventListener('click', toggleMenu);

  // Close menu when a nav link is clicked
  navOverlay.querySelectorAll('[data-close-menu]').forEach((link) => {
    link.addEventListener('click', () => {
      if (menuOpen) toggleMenu();
    });
  });
}

/* ============================================
   5. HERO — HORIZONTAL SCROLL
   ============================================ */
function initHero() {
  const heroOuter = document.getElementById('hero-outer');
  const heroStep1 = document.getElementById('hero-step1');
  const heroCard2 = document.getElementById('hero-card-2');
  const heroCard3 = document.getElementById('hero-card-3');
  const heroTitle = document.getElementById('hero-title');
  const heroDesc = document.getElementById('hero-desc');
  const heroNav = document.getElementById('hero-nav');
  const heroSocial = document.getElementById('hero-social');

  if (!heroOuter || !heroStep1 || !heroCard2 || !heroCard3) return;

  /* --- Entrance animations (page load) --- */
  if (!prefersReduced) {
    if (heroTitle) {
      gsap.from(heroTitle, {
        y: 120,
        opacity: 0,
        duration: 1.4,
        ease: 'power4.out',
        delay: 0.3,
      });
    }
    if (heroDesc) {
      gsap.from(heroDesc, {
        y: 60,
        opacity: 0,
        duration: 1.2,
        ease: 'power4.out',
        delay: 0.5,
      });
    }
    if (heroNav) {
      gsap.from(heroNav.querySelectorAll('li'), {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.1,
        delay: 0.2,
      });
    }
    if (heroSocial) {
      gsap.from(heroSocial.querySelectorAll('li'), {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.08,
        delay: 0.8,
      });
    }
  }

  /* --- Scroll-driven horizontal slide --- */
  if (prefersReduced) return;

  setTimeout(() => {
    const vw = window.innerWidth;
    const step1Width = heroStep1.scrollWidth;
    const totalTranslateX = step1Width - vw;

    // Set outer height for scroll distance
    heroOuter.style.height = `${vw + totalTranslateX}px`;

    // Cards start overlapped
    const cardWidth = vw * 0.5;
    const card2InitialX = -cardWidth * 0.62;
    const card3InitialX = -cardWidth * 1.74;

    gsap.set(heroCard2, { x: card2InitialX });
    gsap.set(heroCard3, { x: card3InitialX });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: heroOuter,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });

    tl.to(heroStep1, { x: -totalTranslateX, ease: 'none' }, 0);
    tl.to(heroCard2, { x: 0, ease: 'power1.out' }, 0);
    tl.to(heroCard3, { x: 0, ease: 'power1.out' }, 0);

    // Recalculate on resize — ignore height-only changes (mobile browser chrome show/hide)
    let prevHeroWidth = window.innerWidth;
    window.addEventListener('resize', () => {
      const newWidth = window.innerWidth;
      if (newWidth !== prevHeroWidth) {
        prevHeroWidth = newWidth;
        ScrollTrigger.refresh();
      }
    });
  }, 100);
}

/* ============================================
   6. PROJECTS GALLERY — vertical strip
   ============================================ */
function initProjectsGallery() {
  const galleryOuter = document.getElementById('gallery-outer');
  const galleryStrip = document.getElementById('gallery-strip');
  const galleryRight = document.getElementById('gallery-right');

  if (!galleryOuter || !galleryStrip) return;
  if (prefersReduced) return;

  const MIN_SCALE = 0.667;
  const SCALE_END = 0.35;
  const TAIL_SCROLL = 600;

  function setup() {
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    // On mobile: keep scroll + parallax, remove scale shrink
    if (vw < 768) {
      const stripHeight = galleryStrip.scrollHeight;
      const mobileLeft = vh * 0.62;
      const maxTranslateY = Math.max(0, stripHeight - mobileLeft);
      const outerHeight = vh + maxTranslateY + TAIL_SCROLL;
      galleryOuter.style.setProperty('--gallery-section-height', `${outerHeight}px`);

      ScrollTrigger.getAll()
        .filter((st) => st.vars.trigger === galleryOuter)
        .forEach((st) => st.kill());

      const images = galleryStrip.querySelectorAll('.gallery-img');

      ScrollTrigger.create({
        trigger: galleryOuter,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;
          const y = -maxTranslateY * Math.min(p, 1);
          gsap.set(galleryStrip, { scale: 1, y });
          if (galleryRight) gsap.set(galleryRight, { x: 0 });
          images.forEach((img) => {
            const rect = img.getBoundingClientRect();
            const imgCenter = rect.top + rect.height / 2;
            const distFromCenter = (imgCenter - mobileLeft / 2) / mobileLeft;
            const px = Math.max(-7, Math.min(7, distFromCenter * -20));
            gsap.set(img, { yPercent: px });
          });
        },
      });
      return;
    }

    const stripHeight = galleryStrip.scrollHeight;
    const scaledHeight = stripHeight * MIN_SCALE;
    const maxTranslateY = Math.max(0, scaledHeight - vh);
    const scrollDistance = maxTranslateY / (1 - SCALE_END) + TAIL_SCROLL;
    const outerHeight = vh + scrollDistance;
    galleryOuter.style.setProperty('--gallery-section-height', `${outerHeight}px`);

    const leftWidth = vw * 0.5;
    const maxShiftX = leftWidth * (1 - MIN_SCALE);

    const images = galleryStrip.querySelectorAll('.gallery-img');

    // Kill existing ScrollTrigger for this section
    ScrollTrigger.getAll()
      .filter((st) => st.vars.trigger === galleryOuter)
      .forEach((st) => st.kill());

    ScrollTrigger.create({
      trigger: galleryOuter,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress;

        if (p <= SCALE_END) {
          const scaleProgress = p / SCALE_END;
          const scale = 1 - scaleProgress * (1 - MIN_SCALE);
          const shiftX = -maxShiftX * scaleProgress;
          gsap.set(galleryStrip, { scale, y: 0 });
          if (galleryRight) gsap.set(galleryRight, { x: shiftX });
          images.forEach((img) => gsap.set(img, { yPercent: 0 }));
        } else {
          const translateProgress = (p - SCALE_END) / (1 - SCALE_END);
          const y = -maxTranslateY * Math.min(translateProgress, 1);
          gsap.set(galleryStrip, { scale: MIN_SCALE, y });
          if (galleryRight) gsap.set(galleryRight, { x: -maxShiftX });

          images.forEach((img) => {
            const rect = img.getBoundingClientRect();
            const imgCenter = rect.top + rect.height / 2;
            const distFromCenter = (imgCenter - vh / 2) / vh;
            const px = Math.max(-7, Math.min(7, distFromCenter * -20));
            gsap.set(img, { yPercent: px });
          });
        }
      },
    });

    // --- Text reveal animations (right side) ---

    // 1. Heading characters slide up
    const chars = galleryOuter.querySelectorAll('.gallery-char');
    gsap.fromTo(
      chars,
      { yPercent: 120 },
      {
        yPercent: 0,
        duration: 0.8,
        ease: 'power2.out',
        stagger: 0.04,
        scrollTrigger: {
          trigger: galleryOuter,
          start: 'top 50%',
          end: 'bottom 50%',
          toggleActions: 'play reverse play reverse',
        },
      }
    );

    // 2. List nums & labels
    gsap.fromTo(
      galleryOuter.querySelectorAll('.gallery-list-num'),
      { yPercent: 200 },
      {
        yPercent: 0,
        duration: 0.8,
        ease: 'power2.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: galleryOuter,
          start: 'top 45%',
          end: 'bottom 50%',
          toggleActions: 'play reverse play reverse',
        },
      }
    );

    gsap.fromTo(
      galleryOuter.querySelectorAll('.gallery-list-label'),
      { yPercent: 200 },
      {
        yPercent: 0,
        duration: 0.8,
        ease: 'power2.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: galleryOuter,
          start: 'top 45%',
          end: 'bottom 50%',
          toggleActions: 'play reverse play reverse',
        },
      }
    );

    // 3. Separator lines scaleX 0 → 1
    gsap.fromTo(
      galleryOuter.querySelectorAll('.gallery-list-line'),
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: galleryOuter,
          start: 'top 50%',
          end: 'bottom 50%',
          toggleActions: 'play reverse play reverse',
        },
      }
    );

    // 4. Description
    const desc = galleryOuter.querySelector('.gallery-desc');
    if (desc) {
      gsap.fromTo(
        desc,
        { yPercent: 100, autoAlpha: 0 },
        {
          yPercent: 0,
          autoAlpha: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: galleryOuter,
            start: 'top 35%',
            end: 'bottom 50%',
            toggleActions: 'play reverse play reverse',
          },
        }
      );
    }

    // 5. Button
    const btn = galleryOuter.querySelector('.gallery-btn');
    if (btn) {
      gsap.fromTo(
        btn,
        { yPercent: 100, autoAlpha: 0 },
        {
          yPercent: 0,
          autoAlpha: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: galleryOuter,
            start: 'top 30%',
            end: 'bottom 50%',
            toggleActions: 'play reverse play reverse',
          },
        }
      );
    }
  }

  setTimeout(setup, 100);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setup, 150);
  });
}

/* ============================================
   7. EXPERTISES — counter-transform card swipe
   ============================================ */
function initExpertises() {
  const section = document.querySelector('.expertises-section');
  if (!section) return;

  const CARD_COUNT = 4;
  const TRANSITIONS = CARD_COUNT - 1; // 3
  const SCROLL_PER_TRANSITION = 1237;
  const TOTAL_SCROLL = SCROLL_PER_TRANSITION * TRANSITIONS; // 3711

  // Set section height
  const sectionHeight = `calc(${TOTAL_SCROLL}px + 100vh)`;
  section.style.setProperty('--expertises-height', sectionHeight);

  if (prefersReduced) {
    // Show all cards in flow
    section.style.height = 'auto';
    const sticky = section.querySelector('.expertises-sticky');
    if (sticky) {
      sticky.style.position = 'relative';
      sticky.style.height = 'auto';
      sticky.style.overflow = 'visible';
    }
    const container = section.querySelector('.expertises-cards-container');
    if (container) {
      container.style.position = 'relative';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
    }
    section.querySelectorAll('.expertise-card').forEach((card) => {
      card.style.position = 'relative';
      card.style.height = 'auto';
      card.style.minHeight = '80vh';
    });
    section.querySelectorAll('.expertise-card-inner').forEach((inner) => {
      inner.style.position = 'relative';
      inner.style.height = 'auto';
      inner.style.padding = '8rem 3rem';
    });
    const heading = section.querySelector('.expertises-heading');
    if (heading) {
      heading.style.position = 'relative';
      heading.style.top = 'auto';
      heading.style.left = 'auto';
      heading.style.padding = '8rem 3rem 4rem';
    }
    const nav = section.querySelector('.expertises-nav');
    if (nav) nav.style.display = 'none';
    return;
  }

  const cards = [];
  const inners = [];
  for (let i = 0; i < CARD_COUNT; i++) {
    cards.push(document.getElementById(`exp-card-${i}`));
    inners.push(document.getElementById(`exp-inner-${i}`));
  }

  const progressFill = document.getElementById('expertises-progress');
  const navButtons = document.querySelectorAll('.expertises-nav-item');

  function easeInOutPower2(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    if (t < 0.5) return 2 * t * t;
    return 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  let currentActiveIndex = 0;

  function updateNavButtons(index) {
    if (index === currentActiveIndex) return;
    currentActiveIndex = index;
    navButtons.forEach((btn, i) => {
      btn.classList.toggle('is-active', i === index);
    });
  }

  function setup() {
    // Kill existing ScrollTriggers for this section
    ScrollTrigger.getAll()
      .filter((st) => st.vars.trigger === section)
      .forEach((st) => st.kill());

    // Heading entrance
    gsap.from('.expertises-heading', {
      y: 80,
      opacity: 0,
      duration: 1.2,
      ease: 'power4.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 80%',
        once: true,
      },
    });

    // Set initial positions
    cards.forEach((card, i) => {
      if (!card || !inners[i]) return;
      if (i === 0) {
        gsap.set(card, { xPercent: 0 });
        gsap.set(inners[i], { xPercent: 0 });
      } else {
        gsap.set(card, { xPercent: 100 });
        gsap.set(inners[i], { xPercent: -100 });
      }
    });

    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const rawIndex = self.progress * TRANSITIONS;
        const transIdx = Math.min(Math.floor(rawIndex), TRANSITIONS - 1);
        const linearT = Math.min(rawIndex - transIdx, 1);
        const easedT = easeInOutPower2(linearT);

        for (let i = 0; i < CARD_COUNT; i++) {
          if (!cards[i] || !inners[i]) continue;
          let cardX;
          if (i < transIdx) {
            cardX = -100;
          } else if (i === transIdx) {
            cardX = -easedT * 100;
          } else if (i === transIdx + 1) {
            cardX = (1 - easedT) * 100;
          } else {
            cardX = 100;
          }
          gsap.set(cards[i], { xPercent: cardX });
          gsap.set(inners[i], { xPercent: -cardX });
        }

        const activeIdx = easedT > 0.5 ? transIdx + 1 : transIdx;
        const clampedIdx = Math.min(Math.max(activeIdx, 0), CARD_COUNT - 1);
        updateNavButtons(clampedIdx);

        if (progressFill) {
          gsap.set(progressFill, { scaleX: self.progress });
        }
      },
    });

    ScrollTrigger.refresh();
  }

  // Nav tab click → scroll to section position
  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.getAttribute('data-exp-index'), 10);
      const sectionTop = section.offsetTop;
      const targetScroll = sectionTop + (index / TRANSITIONS) * TOTAL_SCROLL;
      gsap.to(window, {
        scrollTo: { y: targetScroll },
        duration: 1,
        ease: 'power2.inOut',
      });
    });
  });

  setTimeout(setup, 200);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setup, 150);
  });
}

/* ============================================
   8. HORIZONTAL GALLERY
   ============================================ */
function initHorizontalGallery() {
  const outer = document.getElementById('horiz-gallery');
  const track = document.getElementById('horiz-gallery-track');

  if (!outer || !track) return;
  if (prefersReduced) return;

  function setup() {
    // Kill existing
    ScrollTrigger.getAll()
      .filter((st) => st.vars.trigger === outer)
      .forEach((st) => st.kill());

    const scrollWidth = track.scrollWidth - window.innerWidth;
    const sectionHeight = window.innerHeight + scrollWidth;
    outer.style.setProperty('--horiz-section-height', `${sectionHeight}px`);

    ScrollTrigger.create({
      trigger: outer,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        gsap.set(track, { x: -scrollWidth * self.progress });
      },
    });
  }

  setTimeout(setup, 100);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setup, 150);
  });
}

/* ============================================
   9. AGENCY / ATELIER SECTION
   ============================================ */
function initAgency() {
  const section = document.querySelector('.agency-section, .about-workshop');
  if (!section || prefersReduced) return;

  gsap.from('.masonry-grid__heading', {
    y: 80,
    opacity: 0,
    duration: 1.2,
    ease: 'power4.out',
    scrollTrigger: {
      trigger: section,
      start: 'top 75%',
    },
  });

  gsap.from('.masonry-grid__header-right', {
    y: 40,
    opacity: 0,
    duration: 1,
    ease: 'power3.out',
    delay: 0.2,
    scrollTrigger: {
      trigger: section,
      start: 'top 75%',
    },
  });

  gsap.from('.masonry-grid__photo-wrap', {
    y: 60,
    opacity: 0,
    duration: 1,
    ease: 'power3.out',
    stagger: 0.15,
    scrollTrigger: {
      trigger: '.masonry-grid',
      start: 'top 80%',
    },
  });

  gsap.from('.masonry-grid__value-item', {
    y: 40,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out',
    stagger: 0.15,
    scrollTrigger: {
      trigger: '.masonry-grid__values',
      start: 'top 80%',
    },
  });

  // Parallax on all gallery photos
  gsap.set('.masonry-grid__photo-main, .masonry-grid__photo-small-1, .masonry-grid__photo-small-2, .masonry-grid__photo-small-3', { scaleY: 1.2 });
  gsap.fromTo('.masonry-grid__photo-main, .masonry-grid__photo-small-1, .masonry-grid__photo-small-2, .masonry-grid__photo-small-3',
    { yPercent: -5 },
    {
      yPercent: 5,
      ease: 'none',
      scrollTrigger: {
        trigger: '.masonry-grid',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
    }
  );
}

/* ============================================
   10. CTA SECTION
   ============================================ */
function initCta() {
  const section = document.getElementById('cta-section');
  if (!section || prefersReduced) return;

  gsap.from('.cta-title', {
    y: 60,
    opacity: 0,
    duration: 1.2,
    ease: 'power4.out',
    scrollTrigger: {
      trigger: section,
      start: 'top 80%',
    },
  });

  gsap.from('.cta-btn', {
    y: 30,
    opacity: 0,
    duration: 1,
    ease: 'power3.out',
    delay: 0.3,
    scrollTrigger: {
      trigger: section,
      start: 'top 80%',
    },
  });
}

/* ============================================
   11. FOOTER
   ============================================ */
function initFooter() {
  const footer = document.querySelector('.footer');
  if (!footer || prefersReduced) return;

  gsap.from('.footer-big-letters', {
    y: 80,
    opacity: 0,
    duration: 1.4,
    ease: 'power4.out',
    scrollTrigger: {
      trigger: footer,
      start: 'top 85%',
    },
  });

  gsap.from('.footer-info-col', {
    y: 30,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out',
    stagger: 0.1,
    scrollTrigger: {
      trigger: footer,
      start: 'top 80%',
    },
  });
}

/* ============================================
   INIT — Run everything
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll first so Lenis is ready
  try {
    initSmoothScroll();
  } catch (e) {
    console.warn('Lenis not available, using native scroll.', e);
  }

  initPageLoader();
  initCustomCursor();
  initHeader();

  // Give Lenis a tick to initialise before GSAP animations
  setTimeout(() => {
    initHero();
    initProjectsGallery();
    initExpertises();
    initHorizontalGallery();
    initAgency();
    initCta();
    initFooter();
    initAboutPage();

    // Final refresh so all ScrollTrigger positions are correct
    ScrollTrigger.refresh();
  }, 50);
});

/* ============================================
   PAGE: À PROPOS — Animations
   ============================================ */
function initAboutPage() {
  if (!document.querySelector('.about-hero')) return;
  if (prefersReduced) return;

  /* ---- 1. Hero entrance animations (page load) — timeline séquentielle ---- */
  const heroTitle   = document.querySelector('.about-hero__title');
  const heroOverline = document.querySelector('.about-hero__overline');
  const heroDesc    = document.querySelector('.about-hero__desc');
  const heroScroll  = document.querySelector('.about-hero__scroll');
  const heroRight   = document.querySelector('.about-hero__right');

  // Placer l'image hors champ dès maintenant pour éviter un flash
  if (heroRight) gsap.set(heroRight, { xPercent: 80 });

  const heroTl = gsap.timeline();

  // Textes — positions absolues dans la timeline (se chevauchent intentionnellement)
  if (heroOverline) heroTl.from(heroOverline, { y: 30, opacity: 0, duration: 0.9, ease: 'power3.out' }, 0.25);
  if (heroTitle)    heroTl.from(heroTitle,    { y: 100, opacity: 0, duration: 1.4, ease: 'power4.out' }, 0.35);
  if (heroDesc)     heroTl.from(heroDesc,     { y: 50,  opacity: 0, duration: 1.1, ease: 'power3.out' }, 0.6);
  if (heroScroll)   heroTl.from(heroScroll,   { y: 20,  opacity: 0, duration: 0.8, ease: 'power3.out' }, 0.9);

  // Image slide — démarre 0.2s après la fin du dernier élément de texte
  if (heroRight) {
    heroTl.to(heroRight,
      { xPercent: 0, duration: 2.8, ease: 'power2.out' },
      '+=0.2'
    );
  }

  /* ---- Parallax on hero image (scroll) ---- */
  gsap.to('.about-hero__img', {
    yPercent: -8,
    ease: 'none',
    scrollTrigger: {
      trigger: '.about-hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
    },
  });

  /* ---- 2. Scroll indicator bounce loop ---- */
  if (heroScroll) {
    gsap.to(heroScroll.querySelector('.about-hero__scroll-arrow'), {
      y: 6,
      duration: 1.1,
      ease: 'power1.inOut',
      repeat: -1,
      yoyo: true,
      delay: 1.5,
    });
  }

  /* ---- 3. Intro section — staggered editorial reveal ---- */
  const introLabel = document.querySelector('.about-intro .about-section-label');
  const introEntries = document.querySelectorAll('.about-intro__entry');

  if (introLabel) {
    gsap.from(introLabel, {
      y: 20,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.about-intro', start: 'top 80%' },
    });
  }

  introEntries.forEach((entry) => {
    const num  = entry.querySelector('.about-intro__num');
    const text = entry.querySelector('.about-intro__text');

    const tl = gsap.timeline({
      scrollTrigger: { trigger: entry, start: 'top 85%' },
    });

    tl.from(entry, { opacity: 0, duration: 0.3, ease: 'none' })
      .from(num, { y: 20, opacity: 0, duration: 0.5, ease: 'power3.out' }, 0.1)
      .from(text, { y: 50, opacity: 0, duration: 1, ease: 'power4.out' }, 0.2);
  });

  /* ---- 4. Values — stagger reveal ---- */
  const valueCols = document.querySelectorAll('.about-values__col');
  const valuesLabel = document.querySelector('.about-values .about-section-label');
  const valuesRule = document.querySelector('.about-values__rule');

  if (valuesRule) {
    gsap.from(valuesRule, {
      scaleX: 0,
      transformOrigin: 'left center',
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.about-values',
        start: 'top 80%',
      },
    });
  }

  if (valuesLabel) {
    gsap.from(valuesLabel, {
      y: 20,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.about-values',
        start: 'top 75%',
      },
    });
  }

  if (valueCols.length) {
    gsap.from(valueCols, {
      y: 60,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      stagger: 0.18,
      scrollTrigger: {
        trigger: '.about-values__grid',
        start: 'top 75%',
      },
    });
  }

  /* ---- 5. Workshop section ---- */
  const workshopImage = document.querySelector('.about-workshop__image-wrap');
  const workshopText = document.querySelector('.about-workshop__text');
  const workshopLabel = document.querySelector('.about-workshop .about-section-label');

  if (workshopLabel) {
    gsap.from(workshopLabel, {
      y: 20,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.about-workshop',
        start: 'top 80%',
      },
    });
  }

  if (workshopImage) {
    gsap.from(workshopImage, {
      y: 60,
      opacity: 0,
      duration: 1.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.about-workshop__grid',
        start: 'top 75%',
      },
    });
  }

  if (workshopText) {
    gsap.from(workshopText.children, {
      y: 40,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      stagger: 0.15,
      scrollTrigger: {
        trigger: '.about-workshop__grid',
        start: 'top 70%',
      },
    });
  }

  /* ---- 6. Team section ---- */
  const teamQuote = document.querySelector('.about-team__quote p');
  const teamAttribution = document.querySelector('.about-team__attribution');
  const teamLabel = document.querySelector('.about-team .about-section-label');

  if (teamLabel) {
    gsap.from(teamLabel, {
      y: 20,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.about-team',
        start: 'top 80%',
      },
    });
  }

  if (teamQuote) {
    gsap.from(teamQuote, {
      y: 60,
      opacity: 0,
      duration: 1.3,
      ease: 'power4.out',
      scrollTrigger: {
        trigger: '.about-team',
        start: 'top 75%',
      },
    });
  }

  if (teamAttribution) {
    gsap.from(teamAttribution, {
      y: 20,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      delay: 0.3,
      scrollTrigger: {
        trigger: '.about-team',
        start: 'top 72%',
      },
    });
  }

}
