# Inspector Press — Journalistic Bias & Fact-Checking Auditor

<p align="center">
  <img src="extension/images/inspector.svg" alt="Inspector Press Extension UI" width="350"/>
</p>

**Inspector Press** is a Google Chrome and FireFox Extension powered by Google's Gemini AI and FastAPI. Designed for journalists, researchers, and critical news readers, it acts as an automated editorial auditor—analyzing online news articles in real-time to assess objectivity, extract core fact-claims, verify factual integrity, and map stakeholder perspectives.

---

## Overview & Screenshots

---

## Key Features

- **Objectivity Score (0–100):** Evaluates articles for neutral reporting, tone, and framing.
- **Core Claim Extraction & Verdicts:** Extracts factual statements, tags them with colored verdicts (*Feitelijk juist*, *Onjuist*, *Onderbouwd*), and provides concise contextual explanations.
- **Multi-Stakeholder Perspectives:** Maps distinct viewpoints and arguments presented by different stakeholders within the article.
- **BYOK (Bring Your Own Key):** Allows users to input their own Gemini API key for private, local execution.
- **Secure Key Storage:** Stores API keys locally using `chrome.storage.local`.
- **High Availability & Resilience:** Backend implementation includes retry loops with dynamic exponential backoff for handling API rate-limits (`429` / `503`).

---

## Tech Stack

### **Frontend (Chrome Extension)**
- **Manifest V3** compliant architecture.
- Vanilla JavaScript (`sidepanel.js`) using `chrome.scripting` for asynchronous DOM manipulation and article text extraction.
- Clean, responsive HTML/CSS Side Panel UI.

### **Backend (FastAPI & Gemini AI)**
- **Python 3.10+** & **FastAPI** REST API.
- **Google GenAI SDK** using `gemini-3.8-flash` for high-throughput, low-latency structured output.
- **Pydantic** for rigorous schema validation (`FactClaim`, `Perspective`, `BiasAnalysis`).

---

## Getting Started

### Prerequisites
- Python 3.10+
- Google Chrome, Chromium, or FireFox browser
- A free Gemini API key from [Google AI Studio](https://aistudio.google.com/)

---

### 1. Backend Setup

Clone the repository and set up the Python backend:

```bash
git clone https://github.com/jasperdebles/inspector-press.git
cd inspector-press

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI backend
uvicorn main:app --reload
```
The backend server will run at `http://localhost:8000`.

---

### 2. Frontend Extension Setup

#### **Google Chrome / Chromium:**
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** and select the `extension/` directory from this repository.
4. Open any news article, click the **Inspector Press** icon in your browser toolbar to open the Side Panel.
5. Enter your Gemini API key and click **Analyze Current Page**.

#### **Mozilla Firefox:**
1. Open Mozilla Firefox and navigate to `about:debugging#/setup`.
2. Click **This Firefox** in the left sidebar.
3. Click **Load Temporary Add-on...** and select the `manifest.json` file inside the `extension/` directory.
4. Open any news article, click the **Inspector Press** icon in your browser toolbar to open the Sidebar.
5. Enter your Gemini API key and click **Analyze Current Page**.

---

## Project Structure

```text
inspector-press/
├── main.py                  # FastAPI server with Gemini AI orchestration & Pydantic models
├── requirements.txt         # Python dependencies
├── .gitignore               # Git ignore rules
├── extension/               # Chrome Extension source files
│   ├── manifest.json        # Extension manifest (MV3)
│   ├── sidepanel.html       # UI Layout
│   ├── sidepanel.js         # API integration, DOM manipulation & local storage logic
│   └── images/              # Icons and assets
│       ├── inspector.svg
└── README.md
```

---

## Roadmap & Future Enhancements

- [ ] **Cloud Backend Deployment:** Host FastAPI on Render/Railway for production access without running a local server.
- [ ] **Chrome Web Store Release:** Publish as an official extension.
- [ ] **Automated Passive Detection:** Highlight potential bias indicators directly on web pages during browsing.
- [ ] **Freemium Integration:** Optional Stripe integration for users without a Gemini API key.

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
