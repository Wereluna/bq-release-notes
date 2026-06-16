# BigQuery Release Insights Web Application

A premium, modern web dashboard built with Python Flask and vanilla HTML, CSS, and JavaScript. The application fetches, parses, and displays Google Cloud's BigQuery Release Notes, allowing users to search, filter by update type, and share key updates directly to X (Twitter).

## 🚀 Features

- **Granular Update Splitting**: Automatically parses combined daily release notes and splits them into distinct cards based on category headings (e.g., Features, Changes, Deprecations, Issues, Fixes).
- **Premium Dark Aesthetics**: Styled with fluid neon backdrops, glassmorphic surfaces, typography hierarchy (using *Inter* and *Outfit*), and micro-animations.
- **Dynamic Stats Bar**: Real-time counting and animation of total updates, features, changes, and issues.
- **Search & Filters**: Instant fuzzy search across titles/descriptions, category-specific filtering tags, and sorting toggle.
- **Intellectual X Sharing**: Opens a customize-and-compose modal with pre-populated drafts, smart character counting (handling Twitter link shortening to 23 chars), and warnings when exceeding limits.
- **In-Memory Caching**: 5-minute server-side API caching to minimize external network requests, with manual override.

---

## 🛠️ Tech Stack

- **Backend**: Python 3 (Flask, Requests, BeautifulSoup4)
- **Frontend**: Vanilla HTML5, CSS3 (CSS Variables, Flexbox/Grid, Glassmorphic effects), and Vanilla ES6 JavaScript (Fetch API, DOM Manipulation)
- **Icons & Fonts**: FontAwesome v6, Google Fonts (Inter, Outfit)

---

## 💻 Setup & Installation

### Prerequisites
Make sure you have **Python 3** installed on your system.

### 1. Clone or Copy the Repository
Navigate to the project directory:
```bash
cd "bq-realese-notes"
```

### 2. Install Dependencies
Install Flask and other dependencies listed in `requirements.txt`:
```bash
py -m pip install -r requirements.txt
```

### 3. Run the Application
Start the Flask development server:
```bash
py app.py
```

Open your browser and navigate to:
**[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 📂 Project Structure

```text
bq-realese-notes/
├── static/
│   ├── css/
│   │   └── styles.css      # Premium dark-theme glassmorphism styling
│   └── js/
│       └── app.js          # Live search, filters, modal handling & share intent
├── templates/
│   └── index.html          # Main HTML structure and X composer modal
├── app.py                  # Flask application, caching, and Atom XML feed parser
├── requirements.txt        # Project dependencies (Flask, requests, bs4)
└── README.md               # Project documentation
```
