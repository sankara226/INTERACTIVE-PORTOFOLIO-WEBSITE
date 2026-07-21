document.getElementById('year').textContent = new Date().getFullYear();

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(pointer: fine)').matches;

/* ==========================================================================
   Theme toggle (dark / light, persisted) — icon swap handled in CSS
   ========================================================================== */
(function themeToggle() {
  const root = document.documentElement;
  const toggleBtn = document.getElementById('themeToggle');
  const stored = localStorage.getItem('theme');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  applyTheme(stored || 'dark');

  toggleBtn.addEventListener('click', function () {
    const current = root.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
})();

/* ==========================================================================
   Mobile nav toggle
   ========================================================================== */
(function mobileNav() {
  const burger = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');

  burger.addEventListener('click', function () {
    const isOpen = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(isOpen));
  });

  links.querySelectorAll('.nav-link').forEach(function (link) {
    link.addEventListener('click', function () {
      links.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });
})();

/* ==========================================================================
   Header shrink on scroll + active nav link (scroll-spy) + progress bar
   + back-to-top
   ========================================================================== */
(function scrollUX() {
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const sections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);
  const progressBar = document.getElementById('scrollProgress');
  const backToTop = document.getElementById('backToTop');

  function onScroll() {
    const scrollPos = window.scrollY + window.innerHeight * 0.35;
    let activeIndex = 0;

    sections.forEach(function (section, i) {
      if (section.offsetTop <= scrollPos) activeIndex = i;
    });

    navLinks.forEach(function (link, i) {
      link.classList.toggle('active', i === activeIndex);
    });

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
    progressBar.style.width = pct + '%';

    backToTop.classList.toggle('visible', window.scrollY > window.innerHeight * 0.6);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  backToTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ==========================================================================
   Preloader
   ========================================================================== */
(function preloader() {
  const el = document.getElementById('preloader');
  const fill = el.querySelector('.preloader-bar-fill');

  function hide() {
    if (typeof gsap === 'undefined' || reduceMotion) {
      el.style.display = 'none';
      return;
    }
    gsap.to(fill, { width: '100%', duration: 0.4, ease: 'power1.out' });
    gsap.to(el, {
      opacity: 0,
      duration: 0.5,
      delay: 0.3,
      ease: 'power1.out',
      onComplete: function () { el.style.display = 'none'; }
    });
  }

  if (document.readyState === 'complete') {
    hide();
  } else {
    window.addEventListener('load', hide);
    setTimeout(hide, 2000); // safety net in case load never fires cleanly
  }
})();

/* ==========================================================================
   Custom cursor
   ========================================================================== */
(function customCursor() {
  if (!isFinePointer) return;

  const dot = document.getElementById('cursorDot');
  const outline = document.getElementById('cursorOutline');
  const hasGsap = typeof gsap !== 'undefined';

  const moveOutline = hasGsap
    ? gsap.quickTo(outline, 'x', { duration: 0.35, ease: 'power3.out' })
    : null;
  const moveOutlineY = hasGsap
    ? gsap.quickTo(outline, 'y', { duration: 0.35, ease: 'power3.out' })
    : null;

  window.addEventListener('mousemove', function (e) {
    dot.style.transform = 'translate(' + e.clientX + 'px, ' + e.clientY + 'px) translate(-50%, -50%)';

    if (moveOutline && moveOutlineY) {
      moveOutline(e.clientX);
      moveOutlineY(e.clientY);
    } else {
      outline.style.transform = 'translate(' + e.clientX + 'px, ' + e.clientY + 'px) translate(-50%, -50%)';
    }
  });

  const interactiveSelector = 'a, button, .project-card, .skill-pill, input, textarea';
  document.addEventListener('mouseover', function (e) {
    if (e.target.closest(interactiveSelector)) outline.classList.add('is-active');
  });
  document.addEventListener('mouseout', function (e) {
    if (e.target.closest(interactiveSelector)) outline.classList.remove('is-active');
  });
})();

/* ==========================================================================
   3D tilt on project cards
   ========================================================================== */
(function tiltCards() {
  if (!isFinePointer || reduceMotion) return;

  document.querySelectorAll('.tilt-card').forEach(function (card) {
    function onMove(e) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateX = ((y / rect.height) - 0.5) * -10;
      const rotateY = ((x / rect.width) - 0.5) * 10;

      if (typeof gsap !== 'undefined') {
        gsap.to(card, { rotateX: rotateX, rotateY: rotateY, y: -8, duration: 0.4, ease: 'power2.out' });
      } else {
        card.style.transform = 'rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-8px)';
      }
    }

    function onLeave() {
      if (typeof gsap !== 'undefined') {
        gsap.to(card, { rotateX: 0, rotateY: 0, y: 0, duration: 0.5, ease: 'power2.out' });
      } else {
        card.style.transform = '';
      }
    }

    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
  });
})();

/* ==========================================================================
   GSAP scroll/entrance animations
   ========================================================================== */
(function animations() {
  if (typeof gsap === 'undefined' || reduceMotion) return;

  gsap.registerPlugin(ScrollTrigger);

  // Split hero title lines into per-character spans for a staggered reveal
  document.querySelectorAll('[data-split]').forEach(function (line) {
    const text = line.textContent;
    line.textContent = '';
    text.split('').forEach(function (char) {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = char === ' ' ? ' ' : char;
      line.appendChild(span);
    });
  });

  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  heroTl
    .from('[data-anim="eyebrow"]', { y: 24, opacity: 0, duration: 0.6 })
    .from('.hero-title .char', { y: 60, opacity: 0, duration: 0.7, stagger: 0.02 }, '-=0.3')
    .from('[data-anim="subtitle"]', { y: 24, opacity: 0, duration: 0.7 }, '-=0.4')
    .from('[data-anim="cta"]', { y: 24, opacity: 0, duration: 0.7 }, '-=0.45')
    .from('.orb', { scale: 0.6, opacity: 0, duration: 1.2, stagger: 0.15, ease: 'power2.out' }, 0);

  // Floating orbs
  gsap.to('.orb-1', { y: 30, x: 20, duration: 6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  gsap.to('.orb-2', { y: -25, x: -15, duration: 7, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  gsap.to('.orb-3', { y: 20, x: -20, duration: 5, repeat: -1, yoyo: true, ease: 'sine.inOut' });

  // Generic scroll reveal for anything with .reveal
  document.querySelectorAll('.reveal').forEach(function (el, i) {
    gsap.from(el, {
      y: 40,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
      delay: (i % 3) * 0.05,
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      }
    });
  });

  // Project cards stagger as a group
  gsap.from('.project-card', {
    y: 60,
    opacity: 0,
    duration: 0.8,
    stagger: 0.15,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.project-grid',
      start: 'top 80%'
    }
  });
})();

/* ==========================================================================
   Contact form: validation + fake submission
   ========================================================================== */
(function contactForm() {
  const form = document.getElementById('contactForm');
  const nameInput = document.getElementById('nameInput');
  const emailInput = document.getElementById('emailInput');
  const messageInput = document.getElementById('messageInput');
  const successBox = document.getElementById('formSuccess');

  const errors = {
    name: document.getElementById('nameError'),
    email: document.getElementById('emailError'),
    message: document.getElementById('messageError')
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setError(input, errorEl, message) {
    input.closest('.form-group').classList.toggle('has-error', Boolean(message));
    errorEl.textContent = message || '';
  }

  function validate() {
    let valid = true;

    if (!nameInput.value.trim()) {
      setError(nameInput, errors.name, 'Please enter your name.');
      valid = false;
    } else {
      setError(nameInput, errors.name, '');
    }

    if (!emailRegex.test(emailInput.value.trim())) {
      setError(emailInput, errors.email, 'Please enter a valid email address.');
      valid = false;
    } else {
      setError(emailInput, errors.email, '');
    }

    if (!messageInput.value.trim()) {
      setError(messageInput, errors.message, 'Please write a short message.');
      valid = false;
    } else {
      setError(messageInput, errors.message, '');
    }

    return valid;
  }

  [nameInput, emailInput, messageInput].forEach(function (input) {
    input.addEventListener('input', validate);
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    if (!validate()) return;

    const submission = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      message: messageInput.value.trim(),
      sentAt: new Date().toISOString()
    };

    // No backend wired up yet — log locally and show confirmation.
    console.log('Contact form submission:', submission);

    successBox.classList.add('visible');
    form.reset();

    setTimeout(function () {
      successBox.classList.remove('visible');
    }, 4000);
  });
})();
