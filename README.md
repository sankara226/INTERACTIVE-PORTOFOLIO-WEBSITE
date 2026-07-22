# Interactive Portfolio Website

A personal portfolio website showcasing my AI learning journey with Claude.

## Features

- HTML/CSS/JavaScript, no build step or dependencies required
- Responsive design (mobile, tablet, desktop)
- Animated, interactive UI powered by [GSAP](https://gsap.com/) + ScrollTrigger (scroll reveals, hero intro timeline, hover/scroll micro-interactions)
- Dark/light theme toggle with persisted preference
- Contact form with client-side validation and submission feedback
- Smooth scrolling navigation with active-section highlighting

## Structure

```
interactive-portfolio-website/
├── README.md
├── index.html
├── main.py            # optional local backend (FastAPI)
├── requirements.txt
├── styles/
│   └── main.css
├── scripts/
│   └── main.js
└── assets/
```

## How to view

Just open `index.html` in a browser — no install or build step needed. The site is fully
functional as a static page on its own.

## Optional backend (FastAPI)

There's a small local Python API (`main.py`) that the frontend talks to when it's running:

- `GET /api/projects` — the frontend fetches this and re-renders the project cards from it
- `POST /api/feedback/` — the contact form posts its data here after validating

**This is optional and local-only.** If the backend isn't running (which is the case for
every real visitor on the deployed GitHub Pages site), the frontend fails the request
quietly and falls back to the project cards already built into `index.html`, and the
contact form still shows its confirmation message. Nothing breaks either way — it's a
progressive enhancement, not a requirement.

### Run it locally

```bash
pip install -r requirements.txt
python main.py
```

The API starts at `http://localhost:8000`. With it running, open `index.html` in a browser
(or refresh a tab that's already open) — the project list will be fetched live from the API,
and submitting the contact form will send it there too. Check the terminal running `main.py`
to see the feedback print out, or your browser's console for `"Projects loaded live from the
backend API."` / `"Feedback sent to backend"` log messages confirming the connection.

CORS (`allow_origins=["*"]`) is enabled so the API can be called from any origin — useful
since the frontend may be opened as a local file or served from GitHub Pages.

## Preview

Live via GitHub Pages: `https://sankara226.github.io/INTERACTIVE-PORTOFOLIO-WEBSITE/`
(enable it under Settings → Pages → Deploy from branch `main` / root, if not already enabled).

## Tech

- HTML5 / CSS3 (custom properties, responsive grid/flexbox)
- Vanilla JavaScript
- GSAP + ScrollTrigger (via CDN)
- FastAPI + Uvicorn (optional local backend)
