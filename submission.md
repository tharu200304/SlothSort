*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 3: Slow and Steady](https://dev.to/challenges/hacktoberfest-week3-2026-10-19)*

# SlothSort 🦥: Autonomous Local AI File & Clutter Tidier

<p align="center">
  <img src="https://raw.githubusercontent.com/tharu200304/SlothSort/main/assets/slothsort_cover.jpg" alt="SlothSort Project Cover" width="100%">
</p>

### 📖 System Overview

> **SlothSort** is an autonomous, privacy-first desktop file tidier engineered for the **Hacktoberfest "Slow and Steady" AI Challenge**. It channels the true spirit of the sloth—conserving human energy and automating the chores we dread—by turning chaotic `Downloads` and `Desktop` folders into clean, organized vaults without lifting a finger.

Powered by local open-weight Small Language Models (SLMs) such as **Llama 3.2 3B** and **Qwen 2.5 3B** orchestrated through **Ollama**, SlothSort inspects document headers, extracts semantic intent, categorizes files across 18 specialized vault domains, and normalizes messy filenames with standardized date stamps. Featuring a modern viewport-fitted glassmorphic web dashboard, real-time telemetry, and an append-only JSONL manifest, it delivers **effortless desktop organization with zero cloud API costs, zero data leakage, and deterministic 1-click total undo**.

---

## 📑 Table of Contents

- [🦥 What I Built](#what-i-built)
  - [What It Does](#what-it-does)
- [🎥 Demo](#demo)
  - [Visual Dashboard Highlights](#visual-dashboard-highlights)
- [💻 Code](#code)
- [🛠️ How I Built It](#how-i-built-it)
  - [1. Local Open-Weight Inference (Ollama)](#1-local-open-weight-inference-ollama)
  - [2. Dual-Engine Architecture with Heuristic Fallback](#2-dual-engine-architecture-with-heuristic-fallback)
  - [3. Backend (FastAPI & Python 3.9+)](#3-backend-fastapi--python-39)
  - [4. Viewport-Constrained Frontend (Vanilla HTML/CSS/JS)](#4-viewport-constrained-frontend-vanilla-htmlcssjs)
- [🌐 Why Does Open Innovation Matter?](#why-does-open-innovation-matter)
  - [1. The Ultimate Privacy Barrier](#1-the-ultimate-privacy-barrier)
  - [2. Zero Marginal Cost for Background Daemons](#2-zero-marginal-cost-for-background-daemons)
  - [3. Air-Gapped Autonomy](#3-air-gapped-autonomy)
  - [4. Full Auditability and Trust](#4-full-auditability-and-trust)
- [🤖 My Agent Session](#my-agent-session)
- [⚡ The Lazy Payoff](#the-lazy-payoff)

---

## What I Built
<!-- What does it do, and what effort does it save? Who gets to be a little lazier because of it? -->

Everyone's default `Downloads` and `Desktop` folders quickly become digital landfills of chaos. Cryptic files like `download (1).pdf`, `scan_0042.jpg`, `W2_Tax_Year_2025.txt`, and `untitled_notes_oct.md` pile up over months. We all know we *should* organize them, but manual file triage is one of the most soul-crushing, procrastination-inducing chores on a computer. 

**SlothSort** is built to let you channel your inner sloth. It is an autonomous, 100% local file and clutter organizer powered by quantized open-weight Small Language Models (SLMs) such as **Llama 3.2 3B** and **Qwen 2.5 3B** running through [Ollama](https://ollama.com/).

### What It Does:
1. **Sniffs 2KB File Headers**: Instead of freezing your computer by reading massive files, SlothSort safely samples the first 2,048 bytes of documents, scripts, and media metadata.
2. **Understands Document Intent**: The local open-weight model analyzes the snippet, infers the true semantic purpose of the file, assigns it to one of **18 structured vault domains**, and generates a clean, normalized, date-stamped title (e.g., transforming `download (1).txt` into `2026-10-22_Cloud_Compute_Invoice.txt`).
3. **Reversible Safe Move**: Files are moved into structured category vaults with automatic collision prevention.
4. **Append-Only Audit Manifest**: Every single file operation is logged into an immutable JSONL manifest (`slothsort_manifest.jsonl`), enabling **instant 1-click total undo**.
5. **Modern Glassmorphic Web Dashboard**: A viewport-fitted (`100vh`) dashboard with dense ~38px file tiles, in-app file modal previewer (image rendering, syntax highlighting), batch operations (move, bulk delete, ZIP archive download), and a collapsible real-time engine stream terminal.

**Who gets to be lazier?**
Developers, students, remote workers, accountants, and anyone who has ever stared at a 500-item `Downloads` folder in quiet despair. You click **"Sort Now"** once, and your clutter vanishes into organized vaults while you relax.

---

## Demo
<!-- Share a deployed link or a video demo. -->

- **GitHub Repository**: [https://github.com/tharu200304/SlothSort](https://github.com/tharu200304/SlothSort)
- **Latest Release**: [SlothSort v1.0.0 on GitHub Releases](https://github.com/tharu200304/SlothSort/releases/tag/v1.0.0)

### Visual Dashboard Highlights:

1. **Autonomous Sorting in Action**:
   The dashboard displays a dual-panel workspace: messy inbox on the left with instant AI pre-scan confidence, and the categorized Organized Vault on the right.

2. **High-Density Compact Tiles**:
   File cards are condensed down to sleek ~38px two-line tiles showing category icons, original vs. new filenames, file size, truncated AI reasoning snippets (`💡 ...`), and micro-action toolbars (Copy Path, Move, Rename, Download, Preview, Delete).

3. **In-App Modal Previewer & Batch Actions**:
   Inspect syntax-highlighted code, Markdown notes, or images directly in-browser. Multi-select files to batch-move across categories or download as a bundled ZIP archive.

---

## Code
<!-- Show us the code!  You can embed a GitHub repo directly into your post. -->

{% github tharu200304/SlothSort %}

The repository is structured with clean separation of concerns and zero unnecessary dependencies:

```
slothsort/
├── app.py                 # FastAPI backend server with REST endpoints & file management
├── slothsort.py           # Core local AI sorting engine, CLI, & heuristic classification
├── requirements.txt       # Minimal Python dependencies (FastAPI, Uvicorn, Requests)
├── LICENSE                # MIT License
├── README.md              # Comprehensive documentation & architectural diagrams
├── assets/                # Cover banners & media assets
├── messy_inbox/           # Default sandbox input directory for unorganized files
├── organized_vault/       # Default output directory with categorized subvaults
└── static/                # Modern Glassmorphic Web Dashboard
    ├── index.html         # Viewport-fitted semantic HTML interface
    ├── style.css          # Vanilla CSS design system (Dark mode, glassmorphism)
    └── app.js             # Reactive vanilla client with preview & batch workflows
```

---

## How I Built It
<!-- Which open-source AI did you use (open-weight models, agent harnesses, frameworks, local inference), and how is your project built around it? -->

SlothSort is designed around the philosophy that **local Small Language Models (SLMs) are the perfect tool for local desktop automation**.

### 1. Local Open-Weight Inference (Ollama)
I integrated [Ollama](https://ollama.com/) to orchestrate local open-weight models:
- **`Llama 3.2 3B` (Meta)**: The default engine. At only ~2.0 GB of VRAM/RAM, it runs blisteringly fast even on low-power laptop CPUs.
- **`Qwen 2.5 3B` (Alibaba)**: Secondary model option with outstanding multilingual handling and code comprehension.
- **`Phi-3.5 Mini` & `Mistral 7B`**: Available for deeper semantic understanding and strict JSON schema generation.

The model is prompted with strict JSON schema instructions:
```json
{
  "category": "Invoices & Receipts",
  "suggested_filename": "2026-10-22_Cloud_Compute_Invoice.txt",
  "summary": "Cloud infrastructure compute invoice for October billing cycle",
  "reasoning": "Detected compute instance charges, billing account ID, and total due",
  "tags": ["invoice", "cloud", "billing"],
  "confidence": "98% (High)"
}
```

### 2. Dual-Engine Architecture with Heuristic Fallback
If a user hasn't installed Ollama or doesn't have it running, SlothSort **does not break**. It features a built-in deterministic heuristic rule engine covering all 18 semantic categories with binary magic number detection, regex pattern matching, and file signature parsing.

### 3. Backend (FastAPI & Python 3.9+)
The backend in `app.py` exposes lightweight REST endpoints (`/api/state`, `/api/sort`, `/api/undo`, `/api/file-content`, `/api/batch-action`) with universal path resolution that supports Windows drive letters (`D:\...`), Unix home paths (`~/...`), and relative paths.

### 4. Viewport-Constrained Frontend (Vanilla HTML/CSS/JS)
The web interface is built with zero heavyweight frontend frameworks:
- **Strict 100vh constraint**: The page fits completely inside the browser viewport with zero outer body scrolling.
- **Sub-40px Compact Tiles**: Formatted to display dozens of files on screen simultaneously.
- **Docked Collapsible Terminal**: The bottom engine stream stays out of the way as a 26px live status ticker, expanding via `▲ / ▼` into an audit history.

---

## Why Does Open Innovation Matter?
<!-- Why does open innovation matter for what you built?  What did it make possible that a closed API wouldn't? -->

Open innovation isn't just a technical preference for this project—**it is the only way this project could ethically and practically exist.**

### 1. The Ultimate Privacy Barrier
The files inside a person's `Downloads` or `Desktop` folder are the most sensitive data on their machine:
- Personal tax returns (W-2s, 1099s)
- Bank statements and credit card receipts
- Proprietary source code and API credentials
- Client non-disclosure agreements and contracts
- Medical lab reports and prescriptions

Sending these personal documents across the internet to a third-party commercial cloud AI API violates personal privacy, GDPR, and enterprise compliance. With open-weight models running on `localhost`, **not a single byte ever leaves the user's computer**.

### 2. Zero Marginal Cost for Background Daemons
Continuous background automation using closed proprietary APIs creates constant token anxiety. If a script runs in the background sorting dozens of files every day, subscription bills quickly accumulate. With open-source 3B models, inference costs **$0.00 forever**.

### 3. Air-Gapped Autonomy
Closed AI fails the moment you lose internet access. Open-weight models allow SlothSort to organize files seamlessly on an airplane, on a train, or in an off-grid cabin.

### 4. Full Auditability and Trust
Because the code, the model weights, and the audit manifest (`slothsort_manifest.jsonl`) are open-source and inspectable, users don't have to take our word for it—they can verify that their files are never tampered with and can always be reverted with a single click.

---

## My Agent Session
<!-- Optional, but judges love it. Save your session with DevRelay and embed it with the agent_session tag (see the challenge page), or link to it. -->

The entire development process of SlothSort—from initial architecture brainstorming, designing the dual-engine heuristic and local LLM pipelines, creating the FastAPI + Vanilla JS glassmorphic dashboard, to setting up reversible undo manifests and releases—was developed interactively with the AI agent.

You can inspect the full, interactive transcript of this development session directly on DEV:

{% agent_session 1104 %}

*(Direct session link: [Building SlothSort: Autonomous Local AI File Tidier](https://dev.to/agent_sessions/building-slothsort-autonomous-local-ai-file-tidier-ssnzvg))*

---

## The Lazy Payoff
<!-- Optional, but this is where you can make your post stand out.  How much time or effort does it actually save?  Did you (or someone else) use it this week?  If not, remove this section. -->

Here is the honest math behind the laziness:

- **The Old Manual Way**:
  I accumulated **240+ messy downloads** over the last 3 months. Sorting them manually involves opening each file, figuring out what it is, renaming it to something sensible, creating a folder, and dragging it in. That takes approximately **15 to 20 seconds per file** = **~60 to 80 minutes of pure, dreaded boredom**.
- **The SlothSort Way**:
  1. Open SlothSort dashboard.
  2. Select target folder.
  3. Click **"⚡ Sort Now (Reward Laziness)"**.
  4. In **14 seconds**, all files are categorized into clean folders (`Invoices`, `Code`, `Legal`, `Research`, `Taxes`, etc.) with standardized date-stamped filenames.

**Time Saved**: ~1 hour of painful clicking per cleanup batch = **Over 10 hours of procrastination avoided every year**. 

Best of all, if you ever change your mind about a sorting run, the **"↩ Undo"** button deterministically restores every file back to where it was in less than 1 second. That is the ultimate lazy payoff.

<!-- Thanks for participating! -->
