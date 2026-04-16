# CareerForge

**AI-powered job search pipeline** — discover, evaluate, apply, and prepare for your next role from a single dashboard.

Built with Next.js 16, Prisma (SQLite), and pluggable LLM providers (Claude, OpenAI, Gemini, Ollama).



**🎥 Demo Video**:

![CareerForge Pipeline Demo](docs/demo/demo-video.gif)

---

## ✨ Features

### Phase 1: Find Jobs

<details>
<summary><b>🔍 Scanner</b> — Search for jobs across 54+ company portals</summary>

Load 54+ default portals (Anthropic, OpenAI, Google, NVIDIA, etc.), then search by role. Results show H1B status, with "View Job" and "Add to Queue" actions.

![Scanner — 54 portals loaded](docs/demo/scanner_portals.png)
![Scanner — 25 results for Senior Data Scientist](docs/demo/scanner_results.png)

</details>

<details>
<summary><b>◎ Evaluate</b> — AI-score any job against your profile</summary>

Paste a job URL or full description. The AI returns a match score (1–5), tier classification, H1B status, fit analysis, keyword gaps, and tailored CV bullets you can apply directly.

![Evaluate — NVIDIA 4.3/5 score with H1B Friendly badge](docs/demo/evaluate_score.png)
![Evaluate — Keyword gaps, suggested CV bullets, Save to Tracker](docs/demo/evaluate_details.png)

</details>

<details>
<summary><b>⊞ Pipeline</b> — Batch-evaluate queued job URLs</summary>

Queue multiple job URLs and run batch evaluation. Track pending vs. processed items in real time.

![Pipeline — 4 processed URLs from Greenhouse, Indeed, LinkedIn](docs/demo/pipeline.png)

</details>

<details>
<summary><b>▤ Tracker</b> — Manage all applications in one place</summary>

Track every application with score, tier, status, H1B flag, and one-click apply. Filter by company, role, or status.

![Tracker — 6 applications with scores 4.2–4.7, status dropdowns, ⚡ Apply](docs/demo/tracker.png)

</details>

### Phase 2: Apply

<details>
<summary><b>⚡ Auto-Apply Methods</b> — Submission strategies</summary>

Choose between two execution strategies for submitting your application:
- **Manual (✅ Stable / Default):** The system generates your cover letter, answering screening questions based on your profile, and bundles your AI-tailored CV. You simply copy and paste the generated materials into the job form. Recommended for everyone.
- **Claude Computer Use (⚠️ Work in Progress):** Fully automated browser interaction where Claude navigates the job site and fills the form for you. This is an experimental feature and requires a compatible Anthropic API key. Expect occasional API rate limits or visual parsing errors.

</details>

<details>
<summary><b>⊙ Profile Hub</b> — One place for everything about you</summary>

All your personal details, CV, job target, AI settings, and automation preferences live under a single **Profile** page with tabbed navigation:
- **About You** — name, email, phone, location, timezone, LinkedIn, portfolio
- **CV** — markdown editor with ATS audit, PDF download, and print view
- **Job Target** — target roles, salary range, H1B sponsorship filter
- **AI** — LLM provider/model, API key, Brave Search key
- **Automation** — auto-apply method, Computer Use toggle

A **completeness bar** shows overall profile fill percentage, and each tab has a status dot (green = complete, yellow = partial, grey = empty). Feature pages that depend on profile data show a **guided banner** linking directly to the missing tab instead of a cryptic error.

</details>

<details>
<summary><b>◻ CV Editor</b> — Markdown editor with AI-powered ATS Audit</summary>

Edit your CV in markdown (now inside Profile → CV tab). Run ATS Audit to get a compatibility score (0–100), flagged issues, bullets missing metrics, and actionable suggestions. Download as PDF or print.

![CV Editor — Markdown editor with full CV](docs/demo/cv_editor.png)
![ATS Audit — 88/100 score, 2 warnings, 3 bullets flagged](docs/demo/ats_audit.png)

</details>

<details>
<summary><b>◈ LinkedIn</b> — Profile optimizer and post generator</summary>

Two tabs: optimize your LinkedIn profile for recruiter discovery, or generate engagement posts by category (Lesson Learned, Industry Insight, Hot Take, etc.).

![LinkedIn Optimizer — Goal input and profile text area](docs/demo/linkedin.png)

</details>

<details>
<summary><b>◇ Stories</b> — STAR+R interview answer bank</summary>

Build a repository of interview stories using the STAR+R framework (Situation, Task, Action, Result, Reflection). Tag and filter for quick prep.

![Story Bank — Add Story button, STAR+R format](docs/demo/stories.png)

</details>

<details>
<summary><b>◉ Reports</b> — Saved evaluations and LinkedIn outreach</summary>

Browse all past evaluations with scores and dates. Click any report to view full details and generate LinkedIn outreach messages for hiring managers, recruiters, and peers.

![Reports — 6 saved evaluations with scores](docs/demo/reports.png)

</details>

### Phase 3: Research & Learn

<details>
<summary><b>⊛ Research</b> — 6-axis company deep dive</summary>

Enter a company name and role to get AI analysis across 6 axes: AI Strategy, Recent Moves, Engineering Culture, Probable Challenges, Competitors & Positioning, and Your Angle.

![Research — Company and Role inputs](docs/demo/research.png)

</details>

<details>
<summary><b>⊟ Compare</b> — Side-by-side offer comparison</summary>

Select 2–5 evaluated reports and compare across 10 weighted dimensions (North Star, CV Match, Comp, Growth, Remote, Tech Stack, etc.). Get a Best Fit recommendation with pros/cons.

![Compare — 6 reports available for selection](docs/demo/compare.png)

</details>

<details>
<summary><b>◑ Training</b> — Course & certification evaluator</summary>

Enter a course or certification name and get an AI-powered ROI verdict: DO IT, DO WITH TIMEBOX, or SKIP — with dimension scores and action plans.

![Training — Course name, URL, description inputs](docs/demo/training.png)

</details>

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- (Optional) [Ollama](https://ollama.ai) for free local AI

### 🛠️ Step-by-Step Setup

**1. Clone the repository**
```bash
git clone https://github.com/sharad28/Career-Forge.git
cd Career-Forge
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure Environment Variables**
Copy the example environment file:
```bash
cp .env.example .env
```
Open `.env` in your editor. You must provide a 32-character random string for `ENCRYPTION_KEY` to securely encrypt your API keys locally. You can generate one quickly in your terminal by running:
```bash
openssl rand -base64 32
```
Leave `DATABASE_URL` as `file:./dev.db` unless you are using an external database.

**4. Initialize the Database**
Generate the Prisma typed client and push the schema to create your local SQLite database:
```bash
npx prisma generate
npx prisma db push
```

**5. Start the Application**
```bash
npm run dev
```

**6. Complete Your Profile**
Open [http://localhost:3000](http://localhost:3000) in your browser.
1. Click **Profile** in the left sidebar — this is where all your setup lives.
2. **About You** tab: fill in your name, email, phone, location, and links.
3. **CV** tab: paste your existing CV in **Markdown format**. This is your master CV used for ATS audits, auto-applications, and AI-powered answers.
4. **Job Target** tab: set your target roles, salary range, and H1B preference.
5. **AI** tab: plug in your preferred LLM API Key (or ensure Ollama is running locally for the free alternative).
6. **Automation** tab: set your default Apply Method (Manual is recommended).
7. Watch the **completeness bar** at the top — aim for 100% before using features. If you skip anything, feature pages will show a banner linking you back to the exact tab you need.

### 💡 Quickstart: Search for Jobs
Once your profile completeness bar hits 100%, here is how to find and evaluate your first role:
1. Click **Scanner** in the left sidebar.
2. Type in your target role (e.g., `"Senior Backend Engineer"`) and location (e.g., `"Remote"`).
3. The system will search across the 54+ default company portals (Greenhouse, Lever, etc.).
4. Browse the results — you will see direct matches alongside AI-flagged tags like "H1B Friendly".
5. Click **Evaluate & Add** on any job you like. The AI will instantly score the job description against your CV and highlight keyword gaps!

> **Tip:** If your profile is incomplete, feature pages show a yellow banner telling you exactly what's missing and linking to the right Profile tab. No more guessing why something failed.

### Environment Variables

| Variable | Required | Description |
|----------|:--------:|-------------|
| `DATABASE_URL` | ✅ | Path to SQLite database (e.g. `file:./dev.db`) |
| `ENCRYPTION_KEY` | ✅ | 32-char key for encrypting API keys at rest |

> **Note:** LLM provider settings (API key, model, base URL) are configured through the Settings UI and stored encrypted in the local database.

---

## 🏗️ Architecture

```
careerforge/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Dashboard
│   ├── profile/            # Profile Hub (tabbed layout)
│   │   ├── about/          #   → Name, contact, links
│   │   ├── cv/             #   → CV Editor + ATS Audit
│   │   ├── job-target/     #   → Target roles, salary, H1B
│   │   ├── ai/             #   → LLM provider & web search
│   │   ├── automation/     #   → Auto-apply preferences
│   │   └── _lib/           #   → Shared useSettings hook
│   ├── scan/               # Job Scanner
│   ├── evaluate/           # AI Job Evaluator
│   ├── tracker/            # Application Tracker
│   ├── pipeline/           # Batch Queue
│   ├── linkedin/           # LinkedIn Optimizer
│   ├── stories/            # STAR+R Story Bank
│   ├── report/             # Evaluation Reports
│   ├── research/           # Company Research
│   ├── compare/            # Offer Comparison
│   ├── training/           # Course Evaluator
│   ├── settings/           # → Redirects to /profile/about
│   ├── cv/                 # → Redirects to /profile/cv
│   ├── apply/              # Auto-Apply Workbench
│   └── api/                # API Routes (one per feature)
├── components/             # Shared UI (Sidebar, ProfileGate)
├── lib/                    # Core business logic
│   ├── ats/                # ATS adapters (Greenhouse, Lever, Ashby)
│   ├── computer-use/       # Claude Computer Use agent
│   └── llm.ts              # LLM provider abstraction
├── prisma/                 # Database schema & migrations
│   ├── schema.prisma
│   └── dev.db              # SQLite database
└── docs/demo/              # Demo screenshots
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | SQLite via Prisma ORM |
| AI | Claude, OpenAI, Gemini, Ollama (pluggable) |
| Styling | CSS (dark theme) |
| Markdown | `marked` for CV rendering |
| ATS | Custom adapters for Greenhouse, Lever, Ashby APIs |
| Auto-Apply | Claude Computer Use (browser automation) |

### AI Provider Support

| Provider | Models | Cost |
|----------|--------|------|
| **Ollama** (local) | gemma4, llama3, mistral, etc. | Free |
| **Claude** (Anthropic) | claude-sonnet-4-6, claude-opus-4-6, claude-haiku-4-5-20251001 | API pricing |
| **OpenAI** | gpt-4o, gpt-4o-mini, gpt-4-turbo | API pricing |
| **Gemini** (Google) | gemini-2.0-flash, gemini-1.5-pro | API pricing |

---

## 📊 Demo Results

Live tests conducted with Ollama `gemma4:latest` (local, free):

| Test | Result |
|------|--------|
| **Scanner Search** | 54 portals loaded → "Senior Data Scientist" → **25 results** (Anthropic, OpenAI, Google DeepMind) |
| **Job Evaluation** | NVIDIA Sr. ML Engineer → **4.3/5** score, 5 keyword gaps, 3 tailored CV bullets |
| **ATS Audit** | CV scored **88/100**, 2 warnings, 3 bullets flagged for missing metrics |
| **Tracker** | 6 applications tracked, scores 4.2–4.7/5 |

---

## 🔐 Security

- **Local-first**: All data stored in local SQLite database
- **Encrypted API keys**: Provider keys encrypted with `ENCRYPTION_KEY` before storage
- **No external telemetry**: Keys only sent to the configured LLM provider
- **No cloud dependency**: Works fully offline with Ollama

---

## 📄 License

MIT
