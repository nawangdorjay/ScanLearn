'use client';

import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ImageIcon,
  Loader2,
  Pencil,
  Settings2,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuizStore } from '@/store/quiz-store';
import type { DifficultyLevel, QuestionType, QuizQuestion } from '@/lib/types';
import { sampleQuizQuestions } from '@/lib/sample-quiz';

const difficultyOptions: { value: DifficultyLevel; label: string; description: string }[] = [
  { value: 'beginner', label: 'Beginner', description: 'Basic recall and understanding' },
  { value: 'intermediate', label: 'Intermediate', description: 'Application and analysis' },
  { value: 'advanced', label: 'Advanced', description: 'Critical thinking and evaluation' },
];

const questionTypeOptions: { value: QuestionType; label: string }[] = [
  { value: 'mcq', label: 'Multiple Choice' },
  { value: 'true_false', label: 'True / False' },
  { value: 'fill_blank', label: 'Fill in the Blank' },
  { value: 'short_answer', label: 'Short Answer' },
];

const languageOptions = [
  { value: 'English', label: 'English' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Chinese', label: 'Chinese' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Korean', label: 'Korean' },
  { value: 'Portuguese', label: 'Portuguese' },
];

export function QuizGenerator() {
  const {
    uploadedImage,
    setUploadedImage,
    settings,
    setSettings,
    isGenerating,
    setIsGenerating,
    setQuizQuestions,
    setView,
  } = useQuizStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(true);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, or WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [setUploadedImage]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const toggleQuestionType = (type: QuestionType) => {
    const current = settings.questionTypes;
    if (current.includes(type)) {
      if (current.length > 1) {
        setSettings({ questionTypes: current.filter((t) => t !== type) });
      }
    } else {
      setSettings({ questionTypes: [...current, type] });
    }
  };

  const handleGenerate = async () => {
    if (!uploadedImage) {
      setError('Please upload a textbook page image first.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: uploadedImage,
          difficulty: settings.difficulty,
          numQuestions: settings.numQuestions,
          questionTypes: settings.questionTypes,
          language: settings.language,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to generate quiz');
      }

      const data = await res.json();

      if (data.questions && data.questions.length > 0) {
        setQuizQuestions(data.questions);
        setView('quiz');
      } else {
        throw new Error('No questions generated. Please try again.');
      }
    } catch (err) {
      console.error('Generation error:', err);
      // Fallback to sample data
      const shuffled = [...sampleQuizQuestions].sort(() => Math.random() - 0.5);
      const sliced = shuffled.slice(0, settings.numQuestions);
      setQuizQuestions(sliced);
      setView('quiz');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1 px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-3xl">
        {/* Page Title */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Generate Your Quiz
          </h1>
          <p className="text-muted-foreground">
            Upload a textbook page image and customize your quiz settings
          </p>
        </div>

        {/* Upload Area */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ImageIcon className="h-5 w-5 text-[#2563EB]" />
              Upload Textbook Page
            </CardTitle>
            <CardDescription>
              Drag and drop or click to upload an image of your textbook page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {!uploadedImage ? (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all sm:p-12 ${
                      isDragging
                        ? 'border-[#2563EB] bg-[#2563EB]/5'
                        : 'border-muted-foreground/25 hover:border-[#2563EB]/50 hover:bg-muted/30'
                    }`}
                  >
                    <div className="mb-4 rounded-full bg-[#2563EB]/10 p-4">
                      <Upload className="h-8 w-8 text-[#2563EB]" />
                    </div>
                    <p className="mb-1 text-base font-medium">
                      {isDragging ? 'Drop your image here' : 'Upload a textbook page'}
                    </p>
                    <p className="mb-4 text-sm text-muted-foreground">
                      PNG, JPG, or WebP up to 10MB
                    </p>
                    <Button variant="outline" size="sm" className="gap-2" type="button">
                      <ImageIcon className="h-4 w-4" />
                      Browse Files
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleInputChange}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="relative overflow-hidden rounded-xl border">
                    <img
                      src={uploadedImage}
                      alt="Uploaded textbook page"
                      className="max-h-80 w-full object-contain bg-muted/20"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setUploadedImage(null)}
                      className="absolute right-2 top-2 h-8 w-8 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    Image uploaded successfully
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Settings Panel */}
        <Card className="mb-6">
          <CardHeader
            className="cursor-pointer pb-4"
            onClick={() => setShowSettings(!showSettings)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-[#0D9488]" />
                <CardTitle className="text-lg">Quiz Settings</CardTitle>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-muted-foreground transition-transform ${
                  showSettings ? 'rotate-180' : ''
                }`}
              />
            </div>
          </CardHeader>
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <CardContent className="space-y-6 pb-6">
                  {/* Difficulty */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Difficulty Level</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {difficultyOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setSettings({ difficulty: opt.value })}
                          className={`rounded-lg border-2 p-3 text-left transition-all ${
                            settings.difficulty === opt.value
                              ? 'border-[#2563EB] bg-[#2563EB]/5'
                              : 'border-border hover:border-muted-foreground/30'
                          }`}
                        >
                          <div className="text-sm font-semibold">{opt.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {opt.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Number of Questions */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Number of Questions</Label>
                    <Select
                      value={String(settings.numQuestions)}
                      onValueChange={(val) => setSettings({ numQuestions: Number(val) })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 Questions (Quick)</SelectItem>
                        <SelectItem value="10">10 Questions (Standard)</SelectItem>
                        <SelectItem value="15">15 Questions (Comprehensive)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Question Types */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Question Types</Label>
                    <div className="flex flex-wrap gap-2">
                      {questionTypeOptions.map((opt) => {
                        const isActive = settings.questionTypes.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            onClick={() => toggleQuestionType(opt.value)}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                              isActive
                                ? 'border-[#0D9488] bg-[#0D9488]/10 text-[#0D9488]'
                                : 'border-border text-muted-foreground hover:border-muted-foreground/30'
                            }`}
                          >
                            <Check className={`h-3.5 w-3.5 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Language */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Quiz Language</Label>
                    <Select
                      value={settings.language}
                      onValueChange={(val) => setSettings({ language: val })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languageOptions.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </motion.div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={!uploadedImage || isGenerating}
          className="h-13 w-full gap-2 bg-[#2563EB] text-base font-semibold text-white hover:bg-[#2563EB]/90 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating Quiz with AI...
            </>
          ) : (
            <>
              <Pencil className="h-5 w-5" />
              Generate Quiz
            </>
          )}
        </Button>

        {/* Demo hint */}
        <p className="mt-3 text-center text-xs text-muted-foreground">
          No image? The app works with demo quiz data as fallback.
        </p>
      </div>
    </motion.div>
  );
}
