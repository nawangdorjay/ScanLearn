'use client';

import { BookOpen, Brain, Home, Info, Scan } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useQuizStore } from '@/store/quiz-store';
import { cn } from '@/lib/utils';

export function Header() {
  const { currentView, setView } = useQuizStore();

  const navItems = [
    { view: 'landing' as const, label: 'Home', icon: Home },
    { view: 'generate' as const, label: 'Generate Quiz', icon: Scan },
    { view: 'how-it-works' as const, label: 'How It Works', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => setView('landing')}
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB] text-white">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            <span className="text-[#2563EB]">Scan</span>
            <span className="text-[#0D9488]">Learn</span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 sm:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            return (
              <Button
                key={item.view}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView(item.view)}
                className={cn(
                  'gap-2 transition-all',
                  isActive
                    ? 'bg-[#2563EB] text-white hover:bg-[#2563EB]/90'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setView('generate')}
            className="gap-2 bg-[#2563EB] text-white hover:bg-[#2563EB]/90"
          >
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Start Learning</span>
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="flex items-center gap-1 overflow-x-auto border-t px-4 py-2 sm:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.view;
          return (
            <Button
              key={item.view}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView(item.view)}
              className={cn(
                'shrink-0 gap-1.5 text-xs',
                isActive
                  ? 'bg-[#2563EB] text-white'
                  : 'text-muted-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Button>
          );
        })}
      </div>
    </header>
  );
}
