import { create } from 'zustand';
import type {
  AppView,
  QuizSettings,
  QuizQuestion,
  UserAnswer,
  QuizResult,
  AdaptiveDifficulty,
  PipelineInfo,
} from '@/lib/types';

interface QuizStore {
  // Navigation
  currentView: AppView;
  setView: (view: AppView) => void;

  // Image
  uploadedImage: string | null;
  setUploadedImage: (image: string | null) => void;

  // Settings
  settings: QuizSettings;
  setSettings: (settings: Partial<QuizSettings>) => void;

  // Quiz
  quizQuestions: QuizQuestion[];
  setQuizQuestions: (questions: QuizQuestion[]) => void;

  // Pipeline info from the 3-step AI pipeline
  pipelineInfo: PipelineInfo | null;
  setPipelineInfo: (info: PipelineInfo | null) => void;

  // Quiz progress
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  answers: UserAnswer[];
  setAnswer: (questionId: number, answer: string | number | boolean | null) => void;

  // Adaptive difficulty engine
  adaptiveDifficulty: AdaptiveDifficulty;
  setAdaptiveDifficulty: (d: AdaptiveDifficulty) => void;
  adaptiveHistory: boolean[]; // tracks last N answers (true = correct)
  recalculateAdaptiveDifficulty: () => void;

  // Results
  results: QuizResult[];
  setResults: (results: QuizResult[]) => void;

  // Loading
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;

  // Actions
  resetQuiz: () => void;
  resetAll: () => void;
}

const defaultSettings: QuizSettings = {
  difficulty: 'intermediate',
  numQuestions: 5,
  questionTypes: ['mcq', 'true_false'],
  language: 'English',
};

const initialState = {
  currentView: 'landing' as AppView,
  uploadedImage: null as string | null,
  settings: defaultSettings,
  quizQuestions: [] as QuizQuestion[],
  currentIndex: 0,
  answers: [] as UserAnswer[],
  results: [] as QuizResult[],
  isGenerating: false,
  pipelineInfo: null as PipelineInfo | null,
  adaptiveDifficulty: 'medium' as AdaptiveDifficulty,
  adaptiveHistory: [] as boolean[],
};

export const useQuizStore = create<QuizStore>((set, get) => ({
  ...initialState,

  setView: (view) => set({ currentView: view }),

  setUploadedImage: (image) => set({ uploadedImage: image }),

  setSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  setQuizQuestions: (questions) => set({ quizQuestions: questions }),

  setPipelineInfo: (info) => set({ pipelineInfo: info }),

  setCurrentIndex: (index) => set({ currentIndex: index }),

  setAnswer: (questionId, answer) =>
    set((state) => {
      const existing = state.answers.findIndex((a) => a.questionId === questionId);
      const newAnswers = [...state.answers];
      if (existing >= 0) {
        newAnswers[existing] = { questionId, answer };
      } else {
        newAnswers.push({ questionId, answer });
      }
      return { answers: newAnswers };
    }),

  setAdaptiveDifficulty: (d) => set({ adaptiveDifficulty: d }),

  setResults: (results) => set({ results }),

  setIsGenerating: (generating) => set({ isGenerating: generating }),

  /**
   * Adaptive Difficulty Engine
   * Tracks the last 3 answers and adjusts difficulty:
   * - 3/3 correct → level up (easy→medium, medium→hard)
   * - 0/3 correct → level down (hard→medium, medium→easy)
   * - Otherwise → stay at current level
   */
  recalculateAdaptiveDifficulty: () => {
    const state = get();
    const { answers, quizQuestions } = state;
    const windowSize = 3;

    // Need at least 3 answers to adapt
    if (answers.length < windowSize) return;

    // Get the last N answers and check correctness
    const recentAnswers = answers.slice(-windowSize);
    const recentResults: boolean[] = recentAnswers.map((a) => {
      const question = quizQuestions.find((q) => q.id === a.questionId);
      if (!question) return false;

      const userAnswer = a.answer;
      switch (question.type) {
        case 'mcq':
          return userAnswer === question.correctAnswer;
        case 'true_false':
          return userAnswer === question.correctAnswer;
        case 'fill_blank': {
          const userStr = String(userAnswer || '').trim().toLowerCase();
          const correctStr = String(question.correctAnswer).trim().toLowerCase();
          return userStr === correctStr || userStr.includes(correctStr) || correctStr.includes(userStr);
        }
        case 'short_answer': {
          const userStr = String(userAnswer || '').trim().toLowerCase();
          const correctStr = String(question.correctAnswer).trim().toLowerCase();
          const words1 = userStr.split(/\s+/);
          const words2 = correctStr.split(/\s+/);
          const overlap = words1.filter((w) => words2.includes(w)).length;
          return overlap / Math.max(words1.length, words2.length) > 0.5;
        }
        default:
          return false;
      }
    });

    const correctCount = recentResults.filter(Boolean).length;
    const current = state.adaptiveDifficulty;

    let newDifficulty: AdaptiveDifficulty = current;

    if (correctCount === windowSize) {
      // All correct — level up
      if (current === 'easy') newDifficulty = 'medium';
      else if (current === 'medium') newDifficulty = 'hard';
    } else if (correctCount === 0) {
      // All wrong — level down
      if (current === 'hard') newDifficulty = 'medium';
      else if (current === 'medium') newDifficulty = 'easy';
    }

    if (newDifficulty !== current) {
      set({
        adaptiveDifficulty: newDifficulty,
        adaptiveHistory: [...state.adaptiveHistory, ...recentResults],
      });
    } else {
      set({ adaptiveHistory: [...state.adaptiveHistory, ...recentResults] });
    }
  },

  resetQuiz: () =>
    set({
      currentIndex: 0,
      answers: [],
      results: [],
      quizQuestions: [],
      adaptiveDifficulty: 'medium',
      adaptiveHistory: [],
      pipelineInfo: null,
    }),

  resetAll: () => set(initialState),
}));
