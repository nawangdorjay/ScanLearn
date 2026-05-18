'use client';

import { BookOpen, Github, Heart } from 'lucide-react';
import { useQuizStore } from '@/store/quiz-store';

export function Footer() {
  const { setView } = useQuizStore();

  return (
    <footer className="mt-auto border-t border-border/40 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB] text-white">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold">
                <span className="text-[#2563EB]">Scan</span>
                <span className="text-[#0D9488]">Learn</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered adaptive quiz generator for smarter learning. Built for the Gemma 4 Good Hackathon.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button
                  onClick={() => setView('generate')}
                  className="hover:text-[#2563EB] transition-colors"
                >
                  Generate Quiz
                </button>
              </li>
              <li>
                <button
                  onClick={() => setView('how-it-works')}
                  className="hover:text-[#2563EB] transition-colors"
                >
                  How It Works
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Features</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Multimodal AI</li>
              <li>Adaptive Difficulty</li>
              <li>Multi-language</li>
              <li>Privacy-First</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Technology</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Next.js + TypeScript</li>
              <li>Gemma 4 Multimodal</li>
              <li>Tailwind CSS</li>
              <li>shadcn/ui</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} ScanLearn. Built for Gemma 4 Good Hackathon.
          </p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            Made with <Heart className="h-3 w-3 text-red-500" /> using Gemma 4
          </p>
        </div>
      </div>
    </footer>
  );
}
