# ScanLearn — Transform Any Textbook Into an Adaptive Quiz

<p align="center">
  <strong>Powered by Gemma 4 Multimodal + Function Calling</strong><br/>
  <em>Gemma 4 Good Hackathon 2026 | Track: Future of Education</em>
</p>

---

## Overview

ScanLearn is an AI-powered web application that transforms any physical textbook page into an interactive, adaptive quiz in seconds. Simply photograph a page from any textbook, and Gemma 4's multimodal capabilities read and understand the content to generate personalized quizzes tailored to the learner's difficulty level, language, and question type preferences.

**Try the live demo:** [Insert your deployment URL here]

## The Problem

Teachers in under-resourced schools spend hours crafting quizzes by hand from static textbooks. Students receive one-size-fits-all assessments that don't adapt to their individual learning level. Existing digital quiz tools require pre-digitized content, reliable internet, and extensive training — making them inaccessible where they're needed most.

## Our Solution

ScanLearn eliminates all these barriers:

1. **Upload** — Photograph any textbook page (no OCR, no pre-digitization needed)
2. **Configure** — Choose difficulty, question types, and language
3. **Learn** — Take an interactive quiz that adapts to your level in real time

## How Gemma 4 Makes It Possible

### Multimodal Understanding
Gemma 4 processes raw photographs of textbook pages holistically — understanding text, diagrams, tables, and mathematical expressions without requiring separate OCR pipelines.

### Native Function Calling
Quiz generation is structured as a pipeline of specialized tools:
- `analyze_content()` — Extracts key concepts and learning objectives
- `generate_question()` — Creates questions with specified difficulty, type, and language
- `validate_question()` — Ensures every question is grounded in the source material

### Local Deployment
ScanLearn supports full offline deployment using quantized Gemma 4 models. Schools without internet can run the entire application on a single laptop, with student data never leaving the device.

## Technical Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────────┐     ┌──────────────┐
│  User Layer  │────▶│  API Layer   │────▶│  AI Processing Layer │────▶│  Data Layer  │
│              │     │              │     │                     │     │              │
│ • Upload     │HTTPS│ • REST API   │RPC  │ • Gemma 4 Multimodal│R/W  │ • PostgreSQL │
│ • Quiz UI    │     │ • Sessions   │     │ • Function Calling  │     │ • Redis      │
│ • Results    │     │ • Progress   │     │ • Adaptive Engine   │     │              │
└─────────────┘     └──────────────┘     └─────────────────────┘     └──────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes, z-ai-web-dev-sdk |
| AI | Gemma 4 Multimodal, Function Calling |
| State | Zustand |
| Database | PostgreSQL, Redis |
| Styling | Tailwind CSS, Framer Motion |

## Getting Started

### Prerequisites
- Node.js 18+
- npm or bun
- Access to Gemma 4 model API

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/scanlearn.git
cd scanlearn/web

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Mode

ScanLearn includes a built-in fallback mode with sample quiz data. If the AI API is unavailable, the app gracefully falls back to pre-built quizzes so the demo always works.

## Features

- **Image Upload** — Drag-and-drop or file picker for textbook photos
- **Multimodal Analysis** — Gemma 4 reads text, diagrams, and equations
- **Adaptive Difficulty** — Beginner, Intermediate, Advanced
- **Question Types** — MCQ, True/False, Fill-in-the-Blank, Short Answer
- **Multi-Language** — English, Spanish, Hindi, French
- **Real-Time Adaptation** — Difficulty adjusts based on student performance
- **Detailed Results** — Score breakdown with explanations and topic analysis
- **Offline Capable** — Local deployment for schools without internet
- **Privacy-First** — Student data stays on-device

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # SPA entry with client-side routing
│   ├── layout.tsx            # Root layout
│   └── api/
│       └── generate-quiz/
│           └── route.ts      # AI-powered quiz generation API
├── components/
│   ├── landing/
│   │   └── landing-page.tsx  # Hero + feature highlights
│   ├── quiz/
│   │   ├── generator.tsx     # Image upload + settings panel
│   │   ├── player.tsx        # Interactive quiz player
│   │   └── results.tsx       # Score + detailed breakdown
│   ├── how-it-works.tsx      # Pipeline visualization
│   └── layout/
│       ├── header.tsx        # Navigation header
│       └── footer.tsx        # Footer
├── store/
│   └── quiz-store.ts         # Zustand state management
└── lib/
    ├── types.ts              # TypeScript type definitions
    └── sample-quiz.ts        # Fallback demo quiz data
```

## Impact

ScanLearn directly addresses the Future of Education mission by:

- **Eliminating pre-digitization barriers** — Works with physical textbooks via camera
- **Enabling personalized learning** — Adaptive quizzes for every student's level
- **Reaching underserved communities** — Full offline deployment capability
- **Serving diverse learners** — Multilingual support in 4+ languages
- **Protecting student privacy** — Local-first architecture keeps data on-device

## Submission Links

- **Kaggle Writeup:** [Insert Kaggle Writeup URL]
- **Video:** [Insert YouTube URL]
- **Live Demo:** [Insert Demo URL]
- **Code Repository:** [Insert GitHub URL]

## License

MIT License — See [LICENSE](LICENSE) for details.

---

Built with ❤️ for the Gemma 4 Good Hackathon 2026
