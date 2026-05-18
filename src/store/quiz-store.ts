import { create } from 'zustand';
import type {
  AppView,
  QuizSettings,
  QuizQuestion,
  UserAnswer,
  QuizResult,
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

  // Quiz progress
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  answers: UserAnswer[];
  setAnswer: (questionId: number, answer: string | number | boolean | null) => void;

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

  setResults: (results) => set({ results }),

  setIsGenerating: (generating) => set({ isGenerating: generating }),

  resetQuiz: () =>
    set({
      currentIndex: 0,
      answers: [],
      results: [],
      quizQuestions: [],
    }),

  resetAll: () => set(initialState),
}));
