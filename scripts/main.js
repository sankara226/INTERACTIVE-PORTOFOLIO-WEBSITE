document.getElementById('year').textContent = new Date().getFullYear();

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(pointer: fine)').matches;

/* ==========================================================================
   Backend API — same live backend as the Personal Projects API demo site.
   Tries local dev server first, then the real deployed API (longer timeout,
   since Render's free tier can take 30-60s to wake from a cold start), then
   falls back to calling GitHub directly, then finally a static snapshot.
   ========================================================================== */
const LOCAL_API_BASE = 'http://localhost:8000';
const DEPLOYED_API_BASE = 'https://personal-projects-api-xt21.onrender.com';
const GITHUB_USERNAME = 'sankara226';
const REPO_COUNT = 6;

const PROJECTS_FALLBACK = [
  { id: 1, name: 'CLAUDE-CODE-STARTER-KIT', description: 'Learned about AI hallucinations and how to detect them. Built a comprehensive guide with real examples of failure modes and how to catch them before they ship.', repo_url: 'https://github.com/sankara226/CLAUDE-CODE-STARTER-KIT', technologies: ['Claude', 'Prompt Engineering', 'AI Safety'], updated_at: null, stars: 0 },
  { id: 2, name: 'PROMPT-LIBRARY', description: 'Created a collection of reusable prompts following the CONTEXT → TASK → FORMAT structure, built for consistency and reuse across projects.', repo_url: 'https://github.com/sankara226/PROMPT-LIBRARY', technologies: ['Claude', 'Prompt Design', 'Documentation'], updated_at: null, stars: 0 },
  { id: 3, name: 'DATA-PIPELINE-AUTOMATION', description: 'Built a multi-file Python project that automates data cleaning, analysis, and reporting end-to-end — from raw input to a finished report.', repo_url: 'https://github.com/sankara226/DATA-PIPELINE-AUTOMATION', technologies: ['Python', 'Automation', 'Data Analysis'], updated_at: null, stars: 0 },
  { id: 4, name: 'MARKETING-ANALYSIS', description: 'Analyzed campaign and customer data to surface actionable marketing insights, turning raw metrics into clear, decision-ready reporting.', repo_url: 'https://github.com/sankara226/MARKETING-ANALYSIS', technologies: ['Data Analysis', 'SQLite', 'Marketing'], updated_at: null, stars: 0 }
];

function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, timeoutMs || 2000);
  return fetch(url, Object.assign({}, options, { signal: controller.signal }))
    .finally(function () { clearTimeout(timer); });
}

function timeAgo(isoString) {
  if (!isoString) return null;
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  const units = [
    ['year', 31536000], ['month', 2592000], ['week', 604800],
    ['day', 86400], ['hour', 3600], ['minute', 60]
  ];
  for (const [name, secondsInUnit] of units) {
    const value = Math.floor(seconds / secondsInUnit);
    if (value >= 1) return value + ' ' + name + (value > 1 ? 's' : '') + ' ago';
  }
  return 'just now';
}

function normalizeGithubRepo(repo, index) {
  let technologies = repo.topics || [];
  if (!technologies.length && repo.language) technologies = [repo.language];
  return {
    id: index + 1,
    name: repo.name,
    description: repo.description || 'No description yet.',
    repo_url: repo.html_url,
    technologies: technologies,
    updated_at: repo.pushed_at,
    stars: repo.stargazers_count || 0
  };
}

let _resolvedApiBasePromise = null;

function resolveApiBase() {
  if (_resolvedApiBasePromise) return _resolvedApiBasePromise;

  _resolvedApiBasePromise = fetchWithTimeout(LOCAL_API_BASE + '/', {}, 1200)
    .then(function (res) {
      if (!res.ok) throw new Error('local backend error ' + res.status);
      return { base: LOCAL_API_BASE, label: 'local' };
    })
    .catch(function () {
      return fetchWithTimeout(DEPLOYED_API_BASE + '/', {}, 15000)
        .then(function (res) {
          if (!res.ok) throw new Error('deployed backend error ' + res.status);
          return { base: DEPLOYED_API_BASE, label: 'deployed' };
        })
        .catch(function () {
          return { base: null, label: 'none' };
        });
    });

  return _resolvedApiBasePromise;
}

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
   3D tilt on project cards — exposed as a function so cards rendered later
   (e.g. from the backend fetch below) can get the same effect
   ========================================================================== */
function attachTilt(card) {
  if (!isFinePointer || reduceMotion) return;

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
}

document.querySelectorAll('.tilt-card').forEach(attachTilt);

/* ==========================================================================
   GSAP scroll/entrance animations
   ========================================================================== */
(function animations() {
  if (typeof gsap === 'undefined' || reduceMotion) return;

  gsap.registerPlugin(ScrollTrigger);

  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  heroTl
    .from('[data-anim="eyebrow"]', { y: 24, opacity: 0, duration: 0.6 })
    .from('.hero-title .line', { y: 40, opacity: 0, duration: 0.7, stagger: 0.12 }, '-=0.3')
    .from('[data-anim="subtitle"]', { y: 24, opacity: 0, duration: 0.7 }, '-=0.4')
    .from('[data-anim="cta"]', { y: 24, opacity: 0, duration: 0.7 }, '-=0.45')
    .from('.orb', { scale: 0.6, opacity: 0, duration: 1.2, stagger: 0.15, ease: 'power2.out' }, 0);

  // Floating orbs
  gsap.to('.orb-1', { y: 30, x: 20, duration: 6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  gsap.to('.orb-2', { y: -25, x: -15, duration: 7, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  gsap.to('.orb-3', { y: 20, x: -20, duration: 5, repeat: -1, yoyo: true, ease: 'sine.inOut' });

  // Generic scroll reveal for anything with .reveal (excludes project cards —
  // those get their own grouped stagger below, avoiding double-animation)
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

  // Project cards are rendered dynamically (see loadProjects() below), so
  // their entrance animation is triggered there instead of here — at setup
  // time the grid is still empty.

  // Stat counters
  document.querySelectorAll('.stat-num').forEach(function (el) {
    const target = Number(el.getAttribute('data-count-to')) || 0;
    const counter = { val: 0 };
    gsap.to(counter, {
      val: target,
      duration: 1.4,
      ease: 'power2.out',
      onUpdate: function () { el.textContent = Math.round(counter.val); },
      scrollTrigger: {
        trigger: el,
        start: 'top 90%'
      }
    });
  });
})();

/* ==========================================================================
   Live projects: local backend → deployed backend → GitHub direct → static.
   Admin state (adminKey/adminBase) lives here so both project management
   and the render function can see it.
   ========================================================================== */
let adminKey = null;
let adminBase = null;

function buildProjectCard(project) {
  const card = document.createElement('article');
  card.className = 'project-card tilt-card';
  const updated = timeAgo(project.updated_at);

  card.innerHTML =
    '<div class="project-card-top">' +
      '<span class="project-icon">' +
        '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.1.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.4 9.4 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.69 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/></svg>' +
      '</span>' +
      '<h3></h3>' +
    '</div>' +
    '<p></p>' +
    '<div class="project-tags"></div>' +
    '<a target="_blank" rel="noopener noreferrer" class="project-link">View Repo <span class="arrow" aria-hidden="true">→</span></a>' +
    '<div class="project-actions" hidden>' +
      '<button type="button" class="edit-btn">Edit</button>' +
      '<button type="button" class="delete-btn">Delete</button>' +
    '</div>';

  card.querySelector('h3').textContent = project.name;
  card.querySelector('p').textContent = project.description + (updated ? ' (updated ' + updated + ')' : '');
  card.querySelector('.project-link').href = project.repo_url || '#';

  const tagsEl = card.querySelector('.project-tags');
  (project.technologies || []).forEach(function (tag) {
    const tagSpan = document.createElement('span');
    tagSpan.textContent = tag;
    tagsEl.appendChild(tagSpan);
  });

  const actions = card.querySelector('.project-actions');
  if (adminKey) actions.hidden = false;

  actions.querySelector('.edit-btn').addEventListener('click', function () {
    enterEditMode(card, project);
  });

  let deleteArmed = false;
  let disarmTimer = null;
  const deleteBtn = actions.querySelector('.delete-btn');
  deleteBtn.addEventListener('click', function () {
    if (!deleteArmed) {
      deleteArmed = true;
      deleteBtn.textContent = 'Confirm?';
      deleteBtn.classList.add('is-armed');
      disarmTimer = setTimeout(function () {
        deleteArmed = false;
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.remove('is-armed');
      }, 3000);
      return;
    }
    clearTimeout(disarmTimer);
    deleteProject(project.id);
  });

  attachTilt(card);
  return card;
}

function renderProjects(projects, sourceLabel) {
  const grid = document.getElementById('projectGrid');
  const note = document.getElementById('dataSourceNote');
  if (!grid) return;

  grid.innerHTML = '';
  projects.forEach(function (project) {
    grid.appendChild(buildProjectCard(project));
  });

  if (note) note.textContent = sourceLabel;

  if (typeof gsap !== 'undefined' && !reduceMotion) {
    gsap.from('.project-card', {
      y: 40,
      opacity: 0,
      duration: 0.7,
      stagger: 0.12,
      ease: 'power3.out',
      scrollTrigger: { trigger: '#projectGrid', start: 'top 85%' }
    });
  }
}

function enterEditMode(card, project) {
  card.innerHTML =
    '<div class="form-group"><label>Name</label><input type="text" class="edit-name" value=""></div>' +
    '<div class="form-group"><label>Description</label><input type="text" class="edit-description" value=""></div>' +
    '<div class="form-group"><label>Repo URL</label><input type="url" class="edit-repo-url" value=""></div>' +
    '<div class="form-group"><label>Technologies (comma separated)</label><input type="text" class="edit-tech" value=""></div>' +
    '<div class="project-actions">' +
      '<button type="button" class="save-btn btn btn-primary">Save</button>' +
      '<button type="button" class="cancel-btn">Cancel</button>' +
    '</div>' +
    '<span class="admin-form-status edit-status"></span>';

  card.querySelector('.edit-name').value = project.name;
  card.querySelector('.edit-description').value = project.description || '';
  card.querySelector('.edit-repo-url').value = project.repo_url || '';
  card.querySelector('.edit-tech').value = (project.technologies || []).join(', ');

  card.querySelector('.cancel-btn').addEventListener('click', function () {
    card.replaceWith(buildProjectCard(project));
  });

  card.querySelector('.save-btn').addEventListener('click', function () {
    const statusEl = card.querySelector('.edit-status');
    statusEl.textContent = 'Saving…';
    statusEl.className = 'admin-form-status edit-status';

    updateProject(project.id, {
      name: card.querySelector('.edit-name').value.trim(),
      description: card.querySelector('.edit-description').value.trim(),
      repo_url: card.querySelector('.edit-repo-url').value.trim(),
      technologies: card.querySelector('.edit-tech').value.split(',').map(function (t) { return t.trim(); }).filter(Boolean)
    }).catch(function (err) {
      statusEl.textContent = err.message || 'Failed to save.';
      statusEl.className = 'admin-form-status edit-status is-error';
    });
  });
}

function loadProjectsFromGithubDirect() {
  return fetchWithTimeout(
    'https://api.github.com/users/' + GITHUB_USERNAME + '/repos?sort=pushed&direction=desc&per_page=' + REPO_COUNT,
    { headers: { Accept: 'application/vnd.github+json' } },
    5000
  )
    .then(function (res) {
      if (!res.ok) throw new Error('GitHub API error ' + res.status);
      return res.json();
    })
    .then(function (repos) {
      const projects = repos.slice(0, REPO_COUNT).map(normalizeGithubRepo);
      renderProjects(projects, 'Live — fetched directly from the GitHub API in your browser.');
    });
}

function loadProjects() {
  resolveApiBase()
    .then(function (resolved) {
      if (!resolved.base) throw new Error('no backend reachable');
      return fetchWithTimeout(resolved.base + '/api/projects', {}, 8000).then(function (res) {
        if (!res.ok) throw new Error('Backend error ' + res.status);
        return res.json().then(function (data) { return { data: data, label: resolved.label }; });
      });
    })
    .then(function (result) {
      const via = result.label === 'local' ? 'the local FastAPI backend' : 'the deployed API on Render';
      renderProjects(result.data.projects, 'Live — fetched via ' + via + ' (source: ' + (result.data.source || 'github') + ').');
    })
    .catch(function () {
      console.log('No backend reachable — falling back to GitHub directly.');
      return loadProjectsFromGithubDirect().catch(function () {
        console.log('GitHub API not reachable either — showing a static snapshot.');
        renderProjects(PROJECTS_FALLBACK, 'Offline snapshot — live data temporarily unavailable.');
      });
    });
}

/* ==========================================================================
   Admin: unlock, add, update, delete
   ========================================================================== */
function apiRequest(path, options) {
  if (!adminBase) throw new Error('Not unlocked yet.');
  const headers = Object.assign({ 'X-API-Key': adminKey }, (options && options.headers) || {});
  return fetchWithTimeout(adminBase + path, Object.assign({}, options, { headers: headers }), 15000)
    .then(function (res) {
      if (res.status === 401) throw new Error('Admin key was rejected.');
      return res.json().then(function (data) {
        if (!res.ok) throw new Error((data && data.detail) ? JSON.stringify(data.detail) : 'Request failed (' + res.status + ')');
        return data;
      });
    });
}

function deleteProject(id) {
  apiRequest('/api/projects/' + id, { method: 'DELETE' })
    .then(function () { loadProjects(); })
    .catch(function (err) { console.error('Delete failed:', err.message); });
}

function updateProject(id, updates) {
  return apiRequest('/api/projects/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  }).then(function () { loadProjects(); });
}

function createProject(project) {
  return apiRequest('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project)
  });
}

(function adminPanel() {
  const toggle = document.getElementById('adminToggle');
  const panel = document.getElementById('adminPanel');
  const keyInput = document.getElementById('adminKeyInput');
  const unlockBtn = document.getElementById('adminUnlockBtn');
  const keyStatus = document.getElementById('adminKeyStatus');
  const addForm = document.getElementById('addProjectForm');
  const addStatus = document.getElementById('addProjectStatus');

  if (!toggle) return;

  toggle.addEventListener('click', function () {
    const isHidden = panel.hasAttribute('hidden');
    if (isHidden) panel.removeAttribute('hidden'); else panel.setAttribute('hidden', '');
    toggle.classList.toggle('is-active', isHidden);
  });

  unlockBtn.addEventListener('click', function () {
    const key = keyInput.value.trim();
    if (!key) return;

    keyStatus.textContent = 'Checking…';
    keyStatus.className = 'admin-key-status';

    resolveApiBase().then(function (resolved) {
      if (!resolved.base) {
        keyStatus.textContent = 'No backend reachable right now.';
        keyStatus.className = 'admin-key-status is-error';
        return;
      }

      fetchWithTimeout(resolved.base + '/api/feedback', { headers: { 'X-API-Key': key } }, 8000)
        .then(function (res) {
          if (res.status === 401) {
            keyStatus.textContent = 'Invalid key.';
            keyStatus.className = 'admin-key-status is-error';
            return;
          }
          adminKey = key;
          adminBase = resolved.base;
          keyStatus.textContent = 'Unlocked ✓';
          keyStatus.className = 'admin-key-status is-ok';
          addForm.removeAttribute('hidden');
          document.querySelectorAll('.project-actions').forEach(function (el) { el.hidden = false; });
        })
        .catch(function () {
          keyStatus.textContent = 'Could not verify key right now.';
          keyStatus.className = 'admin-key-status is-error';
        });
    });
  });

  addForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const name = document.getElementById('newProjectName').value.trim();
    if (!name) return;

    const project = {
      name: name,
      description: document.getElementById('newProjectDescription').value.trim(),
      repo_url: document.getElementById('newProjectRepoUrl').value.trim(),
      technologies: document.getElementById('newProjectTech').value.split(',').map(function (t) { return t.trim(); }).filter(Boolean)
    };

    addStatus.textContent = 'Adding…';
    addStatus.className = 'admin-form-status';

    createProject(project)
      .then(function () {
        addStatus.textContent = 'Added ✓';
        addStatus.className = 'admin-form-status is-ok';
        addForm.reset();
        loadProjects();
      })
      .catch(function (err) {
        addStatus.textContent = err.message || 'Failed to add project.';
        addStatus.className = 'admin-form-status is-error';
      });
  });
})();

/* ==========================================================================
   Contact form: validation + real POST to the backend, with a genuine
   error state (not a fake success) if nothing is reachable.
   ========================================================================== */
(function contactForm() {
  const form = document.getElementById('contactForm');
  const nameInput = document.getElementById('nameInput');
  const emailInput = document.getElementById('emailInput');
  const messageInput = document.getElementById('messageInput');
  const successBox = document.getElementById('formSuccess');
  const networkErrorBox = document.getElementById('formNetworkError');
  const submitBtn = document.getElementById('contactSubmitBtn');

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

    successBox.classList.remove('visible');
    networkErrorBox.classList.remove('visible');
    submitBtn.disabled = true;

    const submission = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      message: messageInput.value.trim()
    };

    resolveApiBase()
      .then(function (resolved) {
        if (!resolved.base) throw new Error('no backend reachable');
        return fetchWithTimeout(resolved.base + '/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submission)
        }, 15000);
      })
      .then(function (res) {
        if (!res.ok) throw new Error('Backend rejected the submission (' + res.status + ')');
        return res.json();
      })
      .then(function (data) {
        console.log('Feedback sent to backend:', data);
        successBox.classList.add('visible');
        form.reset();
        setTimeout(function () { successBox.classList.remove('visible'); }, 4000);
      })
      .catch(function (err) {
        console.log('Feedback could not be sent:', err.message);
        networkErrorBox.classList.add('visible');
      })
      .finally(function () {
        submitBtn.disabled = false;
      });
  });
})();

resolveApiBase(); // warms the cached resolution so later calls (edit/delete/feedback) don't re-probe
loadProjects();
