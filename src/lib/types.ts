export type QuestionType = 'mcq' | 'true_false' | 'fill_blank' | 'short_answer';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type AppView = 'landing' | 'generate' | 'quiz' | 'results' | 'how-it-works';
export type AdaptiveDifficulty = 'easy' | 'medium' | 'hard';

export interface QuizSettings {
  difficulty: DifficultyLevel;
  numQuestions: number;
  questionTypes: QuestionType[];
  language: string;
}

export interface MCQQuestion {
  type: 'mcq';
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficultyRating?: AdaptiveDifficulty;
  topicTag?: string;
}

export interface TrueFalseQuestion {
  type: 'true_false';
  id: number;
  question: string;
  correctAnswer: boolean;
  explanation: string;
  difficultyRating?: AdaptiveDifficulty;
  topicTag?: string;
}

export interface FillBlankQuestion {
  type: 'fill_blank';
  id: number;
  question: string;
  correctAnswer: string;
  explanation: string;
  difficultyRating?: AdaptiveDifficulty;
  topicTag?: string;
}

export interface ShortAnswerQuestion {
  type: 'short_answer';
  id: number;
  question: string;
  correctAnswer: string;
  explanation: string;
  difficultyRating?: AdaptiveDifficulty;
  topicTag?: string;
}

export type QuizQuestion =
  | MCQQuestion
  | TrueFalseQuestion
  | FillBlankQuestion
  | ShortAnswerQuestion;

export interface UserAnswer {
  questionId: number;
  answer: string | number | boolean | null;
}

export interface QuizResult {
  questionId: number;
  question: string;
  questionType: QuestionType;
  userAnswer: string | number | boolean | null;
  correctAnswer: string | number | boolean;
  isCorrect: boolean;
  explanation: string;
  options?: string[];
  difficultyRating?: AdaptiveDifficulty;
  topicTag?: string;
}

export interface PipelineInfo {
  stages: string[];
  contentAnalysis?: {
    topics?: string[];
    keyConcepts?: string[];
    learningObjectives?: string[];
  };
  validation?: {
    totalGenerated?: number;
    passedValidation?: number;
    removedCount?: number;
  };
  error?: string;
  usedFallback?: boolean;
}
