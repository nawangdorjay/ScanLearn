# ScanLearn — Transform Any Textbook Into an Adaptive Quiz

<p align="center">
  <strong>Made with ❤️ using Gemma 4</strong><br/>
  <em>By Nawang Dorjay</em><br/>
  <strong>Gemma 4 Good Hackathon 2026 | Track: Future of Education</strong>
</p>

<p align="center">
  <img src="public/logo.svg" alt="ScanLearn Logo" width="80" height="80"/>
</p>

---

## Overview

ScanLearn is an AI-powered web application that transforms any physical textbook page into an interactive, adaptive quiz in seconds. Simply photograph a page from any textbook, and Gemma 4's multimodal capabilities read and understand the content to generate personalized quizzes tailored to the learner's difficulty level, language, and question type preferences.

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

### Native Function Calling (3-Step Pipeline)
Quiz generation is structured as a pipeline of specialized tools:
- **`analyze_content()`** — Extracts key concepts, topics, and learning objectives from the image
- **`generate_question()`** — Creates structured questions with difficulty ratings, topic tags, and explanations
- **`validate_question()`** — Ensures every question is grounded in the source material and removes ambiguous items

### Adaptive Difficulty Engine
A sliding-window algorithm tracks the student's last 3 answers and automatically adjusts difficulty:
- 3/3 correct → Level up (e.g., Intermediate → Advanced)
- 0/3 correct → Level down (e.g., Intermediate → Beginner)
- Mixed results → Stay at current level

### Local Deployment
ScanLearn supports full offline deployment using quantized Gemma 4 models (E2B/E4B via Ollama or llama.cpp). Schools without internet can run the entire application on a single laptop, with student data never leaving the device.

## Technical Architecture

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────────────────┐
│  Frontend     │────▶│  API Layer      │────▶│  AI Pipeline (Gemma 4)   │
│               │     │                 │     │                          │
│ • Next.js     │HTTPS│ • /api/generate │ RPC │ • analyze_content()      │
│ • TypeScript  │     │   -quiz         │     │ • generate_question()    │
│ • Tailwind    │     │ • Zustand Store │     │ • validate_question()    │
│ • shadcn/ui   │     │                 │     │ • Adaptive Engine        │
└──────────────┘     └─────────────────┘     └──────────────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui |
| Backend | Next.js API Routes, @google/generative-ai SDK |
| AI Model | Gemma 4 Multimodal (Google AI) |
| State Management | Zustand |
| Animations | Framer Motion |
| Styling | Tailwind CSS, CSS Variables |

## Getting Started

### Prerequisites
- Node.js 18+ (or Bun)
- npm or bun
- A Google AI API key ([Get one free](https://aistudio.google.com/apikey))

### Installation

```bash
# Clone the repository
git clone https://github.com/nawangdorjay/ScanLearn.git
cd ScanLearn

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Google AI API key

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_AI_API_KEY` | Google AI Studio API key for Gemma 4 access | Yes (for AI features) |

### Demo Mode

ScanLearn includes a built-in fallback mode with sample quiz data. If `GOOGLE_AI_API_KEY` is not set, the app gracefully falls back to pre-built biology quizzes so the demo always works.

## Features

- **Image Upload** — Drag-and-drop or file picker for textbook photos
- **Multimodal Analysis** — Gemma 4 reads text, diagrams, and equations from images
- **3-Step AI Pipeline** — Content analysis → Question generation → Validation
- **Adaptive Difficulty** — Real-time sliding-window difficulty adjustment
- **Question Types** — MCQ, True/False, Fill-in-the-Blank, Short Answer
- **Multi-Language** — English, Spanish, Hindi, French, Chinese, Japanese
- **Detailed Results** — Score breakdown with explanations and topic analysis
- **Pipeline Visualization** — See how the AI processes your image step by step
- **Privacy-First** — Images processed on-demand, not stored

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # SPA entry with client-side routing
│   ├── layout.tsx            # Root layout with metadata
│   └── api/
│       └── generate-quiz/
│           └── route.ts      # 3-step AI pipeline (analyze → generate → validate)
├── components/
│   ├── landing/
│   │   └── landing-page.tsx  # Hero + feature highlights + CTA
│   ├── quiz/
│   │   ├── generator.tsx     # Image upload + settings panel
│   │   ├── player.tsx        # Interactive quiz player with difficulty indicator
│   │   └── results.tsx       # Score + detailed breakdown
│   ├── how-it-works.tsx      # Pipeline visualization
│   └── layout/
│       ├── header.tsx        # Navigation header
│       └── footer.tsx        # Footer
├── store/
│   └── quiz-store.ts         # Zustand state + adaptive difficulty engine
└── lib/
    ├── types.ts              # TypeScript type definitions
    ├── utils.ts              # Utility functions
    └── sample-quiz.ts        # Fallback demo quiz data
```

## Impact

ScanLearn directly addresses the Future of Education mission by:

- **Eliminating pre-digitization barriers** — Works with physical textbooks via camera
- **Enabling personalized learning** — Adaptive quizzes adjust to every student's level in real time
- **Reaching underserved communities** — Offline deployment capability with edge models
- **Serving diverse learners** — Multilingual support in 6+ languages
- **Protecting student privacy** — No accounts required, images not stored

## Submission Links

- **Kaggle Writeup:** [Link]
- **Video:** [Link]
- **Live Demo:** [Link]
- **Code Repository:** [https://github.com/nawangdorjay/ScanLearn](https://github.com/nawangdorjay/ScanLearn)

## License

MIT License — See [LICENSE](LICENSE) for details.

---

Made with ❤️ using Gemma 4 by **Nawang Dorjay**

Built for the Gemma 4 Good Hackathon 2026
