'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useQuizStore } from '@/store/quiz-store';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { LandingPage } from '@/components/landing/landing-page';
import { QuizGenerator } from '@/components/quiz/generator';
import { QuizPlayer } from '@/components/quiz/player';
import { ResultsPage } from '@/components/quiz/results';
import { HowItWorksPage } from '@/components/how-it-works';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

function ViewRenderer() {
  const { currentView } = useQuizStore();

  switch (currentView) {
    case 'landing':
      return <LandingPage />;
    case 'generate':
      return <QuizGenerator />;
    case 'quiz':
      return <QuizPlayer />;
    case 'results':
      return <ResultsPage />;
    case 'how-it-works':
      return <HowItWorksPage />;
    default:
      return <LandingPage />;
  }
}

export default function Home() {
  const { currentView } = useQuizStore();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <ViewRenderer />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
