'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Pencil,
  RefreshCw,
  RotateCcw,
  Trophy,
  XCircle,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useQuizStore } from '@/store/quiz-store';
import type { QuizResult } from '@/lib/types';

function ScoreRing({ score, total }: { score: number; total: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const circumference = 2 * Math.PI * 54;
  const radius = 54;

  useEffect(() => {
    let start = 0;
    const end = percentage;
    const duration = 1500;
    const incrementTime = duration / end;
    const timer = setInterval(() => {
      start += 1;
      setAnimatedScore(start);
      if (start >= end) clearInterval(timer);
    }, incrementTime);
    return () => clearInterval(timer);
  }, [percentage]);

  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const getScoreColor = () => {
    if (animatedScore >= 80) return '#0D9488';
    if (animatedScore >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getMessage = () => {
    if (animatedScore >= 90) return { title: 'Outstanding!', subtitle: 'You have an excellent understanding of the material.' };
    if (animatedScore >= 80) return { title: 'Great Job!', subtitle: 'You demonstrated solid knowledge of the concepts.' };
    if (animatedScore >= 60) return { title: 'Good Effort!', subtitle: 'You have a decent grasp but could improve in some areas.' };
    if (animatedScore >= 40) return { title: 'Keep Learning!', subtitle: 'Review the explanations below to strengthen your understanding.' };
    return { title: 'Time to Study!', subtitle: 'Focus on the explanations to build your knowledge.' };
  };

  const message = getMessage();

  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-4">
        <svg width="140" height="140" className="-rotate-90">
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/30"
          />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={getScoreColor()}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color: getScoreColor() }}>
            {animatedScore}%
          </span>
          <span className="text-xs text-muted-foreground">
            {score}/{total}
          </span>
        </div>
      </div>
      <h2 className="mb-1 text-2xl font-bold">{message.title}</h2>
      <p className="text-center text-sm text-muted-foreground">{message.subtitle}</p>
    </div>
  );
}

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

function formatAnswer(answer: string | number | boolean, result: QuizResult): string {
  if (typeof answer === 'boolean') return answer ? 'True' : 'False';
  if (typeof answer === 'number' && result.options) return result.options[answer] || `Option ${String.fromCharCode(65 + answer)}`;
  return String(answer || 'No answer');
}

export function ResultsPage() {
  const { results, quizQuestions, setView, resetQuiz, setUploadedImage } = useQuizStore();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const score = results.filter((r) => r.isCorrect).length;
  const total = results.length;

  const stats = useMemo(() => ({
    correct: results.filter((r) => r.isCorrect).length,
    incorrect: results.filter((r) => !r.isCorrect).length,
    unanswered: results.filter((r) => r.userAnswer === null).length,
  }), [results]);

  const handleRetry = () => {
    resetQuiz();
    setView('generate');
  };

  const handleGenerateNew = () => {
    resetQuiz();
    setUploadedImage(null);
    setView('generate');
  };

  const handleExportResults = () => {
    const lines: string[] = [
      '═══════════════════════════════════════════',
      '           ScanLearn Quiz Results',
      '═══════════════════════════════════════════',
      '',
      `Score: ${score}/${total} (${total > 0 ? Math.round((score / total) * 100) : 0}%)`,
      `Correct: ${stats.correct} | Incorrect: ${stats.incorrect} | Unanswered: ${stats.unanswered}`,
      '',
      '───────────────────────────────────────────',
    ];

    results.forEach((r, i) => {
      lines.push('');
      lines.push(`Question ${i + 1}: ${r.question}`);
      lines.push(`Type: ${getQuestionTypeLabel(r.questionType)}`);
      lines.push(`Your Answer: ${formatAnswer(r.userAnswer, r)}`);
      lines.push(`Correct Answer: ${formatAnswer(r.correctAnswer, r)}`);
      lines.push(`Result: ${r.isCorrect ? '✓ Correct' : '✗ Incorrect'}`);
      lines.push(`Explanation: ${r.explanation}`);
    });

    lines.push('');
    lines.push('═══════════════════════════════════════════');
    lines.push('Generated by ScanLearn | Powered by Gemma 4');

    const text = lines.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scanlearn-quiz-results.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1 px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-3xl">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setView('landing')}
          className="mb-6 gap-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>

        {/* Score Card */}
        <Card className="mb-6">
          <CardContent className="py-8">
            <ScoreRing score={score} total={total} />

            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-green-50 p-3 text-center dark:bg-green-500/10">
                <div className="text-2xl font-bold text-green-600">{stats.correct}</div>
                <div className="text-xs text-green-600/70">Correct</div>
              </div>
              <div className="rounded-lg bg-red-50 p-3 text-center dark:bg-red-500/10">
                <div className="text-2xl font-bold text-red-600">{stats.incorrect}</div>
                <div className="text-xs text-red-600/70">Incorrect</div>
              </div>
              <div className="rounded-lg bg-amber-50 p-3 text-center dark:bg-amber-500/10">
                <div className="text-2xl font-bold text-amber-600">{stats.unanswered}</div>
                <div className="text-xs text-amber-600/70">Unanswered</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Button
            onClick={handleRetry}
            variant="outline"
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Retry Same Quiz
          </Button>
          <Button
            onClick={handleGenerateNew}
            className="gap-2 bg-[#2563EB] text-white hover:bg-[#2563EB]/90"
          >
            <Pencil className="h-4 w-4" />
            Generate New Quiz
          </Button>
          <Button
            onClick={handleExportResults}
            variant="outline"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export Results
          </Button>
        </div>

        {/* Detailed Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-[#0D9488]" />
              Detailed Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((result, i) => {
              const isExpanded = expandedId === result.questionId;
              return (
                <div key={result.questionId}>
                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : result.questionId)
                    }
                    className="flex w-full items-center justify-between gap-3 rounded-lg border p-4 text-left transition-all hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          result.isCorrect
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {result.isCorrect ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          Q{i + 1}. {result.question}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${getQuestionTypeColor(result.questionType)}`}
                          >
                            {getQuestionTypeLabel(result.questionType)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>

                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="ml-11 mt-2 space-y-2 rounded-lg bg-muted/30 p-4"
                    >
                      <div className="text-sm">
                        <span className="font-medium text-muted-foreground">Your Answer: </span>
                        <span className={result.isCorrect ? 'text-green-600' : 'text-red-600'}>
                          {formatAnswer(result.userAnswer, result)}
                        </span>
                      </div>
                      {!result.isCorrect && (
                        <div className="text-sm">
                          <span className="font-medium text-muted-foreground">Correct Answer: </span>
                          <span className="font-medium text-green-600">
                            {formatAnswer(result.correctAnswer, result)}
                          </span>
                        </div>
                      )}
                      <div className="text-sm">
                        <span className="font-medium text-muted-foreground">Explanation: </span>
                        <span>{result.explanation}</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
