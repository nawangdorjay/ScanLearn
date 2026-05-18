'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  HelpCircle,
  Pencil,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useQuizStore } from '@/store/quiz-store';
import type {
  QuizQuestion,
  QuizResult,
  MCQQuestion,
  TrueFalseQuestion,
  FillBlankQuestion,
  ShortAnswerQuestion,
  AdaptiveDifficulty,
} from '@/lib/types';

function getQuestionTypeColor(type: string) {
  switch (type) {
    case 'mcq': return 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20';
    case 'true_false': return 'bg-[#0D9488]/10 text-[#0D9488] border-[#0D9488]/20';
    case 'fill_blank': return 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20';
    case 'short_answer': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    default: return 'bg-muted text-muted-foreground border-border';
  }
}

function getQuestionTypeLabel(type: string) {
  switch (type) {
    case 'mcq': return 'Multiple Choice';
    case 'true_false': return 'True / False';
    case 'fill_blank': return 'Fill in the Blank';
    case 'short_answer': return 'Short Answer';
    default: return type;
  }
}

function getDifficultyColor(d: AdaptiveDifficulty) {
  switch (d) {
    case 'easy': return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    case 'hard': return 'bg-red-500/10 text-red-600 border-red-500/20';
  }
}

function getDifficultyLabel(d: AdaptiveDifficulty) {
  switch (d) {
    case 'easy': return 'Easy';
    case 'medium': return 'Medium';
    case 'hard': return 'Hard';
  }
}

function getDifficultyIcon(d: AdaptiveDifficulty) {
  switch (d) {
    case 'easy': return <TrendingDown className="h-3 w-3" />;
    case 'medium': return <Minus className="h-3 w-3" />;
    case 'hard': return <TrendingUp className="h-3 w-3" />;
  }
}

export function QuizPlayer() {
  const {
    quizQuestions,
    currentIndex,
    setCurrentIndex,
    answers,
    setAnswer,
    setResults,
    setView,
    adaptiveDifficulty,
    adaptiveHistory,
    recalculateAdaptiveDifficulty,
    pipelineInfo,
  } = useQuizStore();

  const currentQuestion = quizQuestions[currentIndex];
  const totalQuestions = quizQuestions.length;
  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;

  const currentAnswer = answers.find((a) => a.questionId === currentQuestion?.id)?.answer ?? null;

  const answeredCount = answers.length;
  const answeredPercent = Math.round((answeredCount / totalQuestions) * 100);

  // Calculate running accuracy for adaptive display
  const runningAccuracy = useMemo(() => {
    if (adaptiveHistory.length === 0) return null;
    const recent = adaptiveHistory.slice(-5);
    return Math.round((recent.filter(Boolean).length / recent.length) * 100);
  }, [adaptiveHistory]);

  const calculateResults = () => {
    const results: QuizResult[] = quizQuestions.map((q) => {
      const userAnswer = answers.find((a) => a.questionId === q.id)?.answer ?? null;
      let isCorrect = false;
      let correctAnswer: string | number | boolean;

      switch (q.type) {
        case 'mcq': {
          correctAnswer = q.correctAnswer;
          isCorrect = userAnswer === q.correctAnswer;
          break;
        }
        case 'true_false': {
          correctAnswer = q.correctAnswer;
          isCorrect = userAnswer === q.correctAnswer;
          break;
        }
        case 'fill_blank': {
          correctAnswer = q.correctAnswer;
          const userStr = String(userAnswer || '').trim().toLowerCase();
          const correctStr = q.correctAnswer.trim().toLowerCase();
          isCorrect = userStr === correctStr || userStr.includes(correctStr) || correctStr.includes(userStr);
          break;
        }
        case 'short_answer': {
          correctAnswer = q.correctAnswer;
          const userStr2 = String(userAnswer || '').trim().toLowerCase();
          const correctStr2 = q.correctAnswer.trim().toLowerCase();
          const words1 = userStr2.split(/\s+/);
          const words2 = correctStr2.split(/\s+/);
          const overlap = words1.filter((w) => words2.includes(w)).length;
          isCorrect = overlap / Math.max(words1.length, words2.length) > 0.5;
          break;
        }
      }

      return {
        questionId: q.id,
        question: q.question,
        questionType: q.type,
        userAnswer,
        correctAnswer,
        isCorrect,
        explanation: q.explanation,
        ...(q.type === 'mcq' ? { options: q.options } : {}),
        difficultyRating: q.difficultyRating,
        topicTag: q.topicTag,
      };
    });

    setResults(results);
    setView('results');
  };

  const handleNext = () => {
    // Run adaptive difficulty engine when moving to next question
    recalculateAdaptiveDifficulty();

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Check if difficulty recently changed
  const difficultyChanged = useMemo(() => {
    if (adaptiveHistory.length < 3) return null;
    const prev3 = adaptiveHistory.slice(-6, -3);
    const curr3 = adaptiveHistory.slice(-3);
    if (prev3.length < 3) return null;
    const prevCorrect = prev3.filter(Boolean).length;
    const currCorrect = curr3.filter(Boolean).length;
    if (currCorrect === 3 && prevCorrect < 3) return 'up';
    if (currCorrect === 0 && prevCorrect > 0) return 'down';
    return null;
  }, [adaptiveHistory]);

  if (!currentQuestion) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1 px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Interactive Quiz</h1>
            <p className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {totalQuestions}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={calculateResults}
            className="gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Finish Quiz
          </Button>
        </div>

        {/* Adaptive Difficulty Indicator */}
        <div className="mb-4 flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-2.5">
          <Zap className="h-4 w-4 text-[#2563EB]" />
          <span className="text-xs font-medium text-muted-foreground">Adaptive Difficulty:</span>
          <Badge variant="outline" className={`gap-1 ${getDifficultyColor(adaptiveDifficulty)}`}>
            {getDifficultyIcon(adaptiveDifficulty)}
            {getDifficultyLabel(adaptiveDifficulty)}
          </Badge>
          {runningAccuracy !== null && (
            <span className="text-xs text-muted-foreground">
              (Recent accuracy: {runningAccuracy}%)
            </span>
          )}
          {difficultyChanged === 'up' && (
            <motion.span
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-semibold text-green-600"
            >
              Leveling up!
            </motion.span>
          )}
          {difficultyChanged === 'down' && (
            <motion.span
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-semibold text-orange-600"
            >
              Adjusting down
            </motion.span>
          )}
        </div>

        {/* Pipeline Info Badge */}
        {pipelineInfo && !pipelineInfo.usedFallback && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {pipelineInfo.stages.map((stage) => (
              <Badge key={stage} variant="secondary" className="text-[10px] font-normal">
                {stage === 'analyze_content' ? '1. Content Analysis' :
                 stage === 'generate_question' ? '2. Question Generation' :
                 stage === 'validate_question' ? '3. Validation' : stage}
              </Badge>
            ))}
            {pipelineInfo.validation && (
              <Badge variant="outline" className="text-[10px] font-normal text-green-600 border-green-500/20">
                {pipelineInfo.validation.passedValidation}/{pipelineInfo.validation.totalGenerated} validated
              </Badge>
            )}
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Question dots */}
        <div className="mb-6 flex flex-wrap gap-2">
          {quizQuestions.map((q, i) => {
            const isAnswered = answers.some((a) => a.questionId === q.id);
            const isCurrent = i === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                  isCurrent
                    ? 'bg-[#2563EB] text-white shadow-lg scale-110'
                    : isAnswered
                    ? 'bg-[#0D9488] text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={getQuestionTypeColor(currentQuestion.type)}
                      >
                        {getQuestionTypeLabel(currentQuestion.type)}
                      </Badge>
                      {currentQuestion.difficultyRating && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${getDifficultyColor(currentQuestion.difficultyRating)}`}
                        >
                          {getDifficultyIcon(currentQuestion.difficultyRating)}
                          {getDifficultyLabel(currentQuestion.difficultyRating)}
                        </Badge>
                      )}
                      {currentQuestion.topicTag && (
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {currentQuestion.topicTag}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg leading-relaxed">
                      {currentQuestion.question}
                    </CardTitle>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2563EB]/10 text-[#2563EB]">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {currentQuestion.type === 'mcq' && (
                  <MCQInput
                    question={currentQuestion}
                    value={currentAnswer as number | null}
                    onChange={(val) => setAnswer(currentQuestion.id, val)}
                  />
                )}
                {currentQuestion.type === 'true_false' && (
                  <TrueFalseInput
                    question={currentQuestion}
                    value={currentAnswer as boolean | null}
                    onChange={(val) => setAnswer(currentQuestion.id, val)}
                  />
                )}
                {currentQuestion.type === 'fill_blank' && (
                  <FillBlankInput
                    value={currentAnswer as string | null}
                    onChange={(val) => setAnswer(currentQuestion.id, val)}
                  />
                )}
                {currentQuestion.type === 'short_answer' && (
                  <ShortAnswerInput
                    value={currentAnswer as string | null}
                    onChange={(val) => setAnswer(currentQuestion.id, val)}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="text-sm text-muted-foreground">
            {answeredCount} of {totalQuestions} answered
          </div>

          <Button
            onClick={handleNext}
            disabled={currentIndex === totalQuestions - 1}
            className="gap-2 bg-[#2563EB] text-white hover:bg-[#2563EB]/90"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function MCQInput({
  question,
  value,
  onChange,
}: {
  question: MCQQuestion;
  value: number | null;
  onChange: (val: number) => void;
}) {
  return (
    <RadioGroup
      value={value !== null ? String(value) : undefined}
      onValueChange={(val) => onChange(Number(val))}
      className="space-y-3"
    >
      {question.options.map((option, i) => (
        <Label
          key={i}
          htmlFor={`option-${i}`}
          className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-all ${
            value === i
              ? 'border-[#2563EB] bg-[#2563EB]/5'
              : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
          }`}
        >
          <RadioGroupItem value={String(i)} id={`option-${i}`} />
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
              {String.fromCharCode(65 + i)}
            </span>
            <span className="text-sm">{option}</span>
          </div>
        </Label>
      ))}
    </RadioGroup>
  );
}

function TrueFalseInput({
  question,
  value,
  onChange,
}: {
  question: TrueFalseQuestion;
  value: boolean | null;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        onClick={() => onChange(true)}
        className={`flex items-center justify-center gap-2 rounded-xl border-2 p-6 text-lg font-semibold transition-all ${
          value === true
            ? 'border-green-500 bg-green-500/10 text-green-700'
            : 'border-border hover:border-green-500/30 hover:bg-muted/30'
        }`}
      >
        <CheckCircle2 className="h-6 w-6" />
        True
      </button>
      <button
        onClick={() => onChange(false)}
        className={`flex items-center justify-center gap-2 rounded-xl border-2 p-6 text-lg font-semibold transition-all ${
          value === false
            ? 'border-red-500 bg-red-500/10 text-red-700'
            : 'border-border hover:border-red-500/30 hover:bg-muted/30'
        }`}
      >
        <XCircle className="h-6 w-6" />
        False
      </button>
    </div>
  );
}

function FillBlankInput({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (val: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer here..."
        className="h-12 text-base"
      />
      <p className="text-xs text-muted-foreground">
        Type the word or phrase that best completes the statement.
      </p>
    </div>
  );
}

function ShortAnswerInput({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (val: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your answer here (1-2 sentences)..."
        className="min-h-24 resize-none text-base"
        rows={4}
      />
      <p className="text-xs text-muted-foreground">
        Provide a concise answer in 1-2 sentences.
      </p>
    </div>
  );
}
