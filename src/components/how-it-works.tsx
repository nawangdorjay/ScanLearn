'use client';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Brain,
  Camera,
  Cpu,
  Layers,
  MessageSquare,
  Sparkles,
  Upload,
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
import { Badge } from '@/components/ui/badge';
import { useQuizStore } from '@/store/quiz-store';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.15 } },
};

const steps = [
  {
    step: 1,
    icon: Upload,
    title: 'Upload a Textbook Page',
    description:
      'Take a photo or upload an image of any textbook page. Our system supports PNG, JPG, and WebP formats. You can capture handwritten notes, printed text, diagrams, or any educational material.',
    color: 'from-[#2563EB] to-[#3B82F6]',
    iconBg: 'bg-[#2563EB]/10',
    iconColor: 'text-[#2563EB]',
  },
  {
    step: 2,
    icon: Brain,
    title: 'Step 1: analyze_content()',
    description:
      'Gemma 4 multimodal vision reads the textbook page image and extracts structured content analysis: main topics, key concepts, learning objectives, difficulty indicators, and specific content segments — understanding text, diagrams, equations, and tables holistically.',
    color: 'from-[#0D9488] to-[#14B8A6]',
    iconBg: 'bg-[#0D9488]/10',
    iconColor: 'text-[#0D9488]',
  },
  {
    step: 3,
    icon: Sparkles,
    title: 'Step 2: generate_question()',
    description:
      'Using the content analysis from Step 2, the AI generates structured quiz questions in multiple formats — MCQs, True/False, Fill-in-the-blank, and Short Answer — each tagged with a difficulty rating (easy/medium/hard) and topic label. Questions include correct answers and detailed explanations.',
    color: 'from-[#F59E0B] to-[#FBBF24]',
    iconBg: 'bg-[#F59E0B]/10',
    iconColor: 'text-[#F59E0B]',
  },
  {
    step: 4,
    icon: Cpu,
    title: 'Step 3: validate_question()',
    description:
      'Each generated question is validated against the original source content. The AI checks that every question is answerable from the textbook page and free of ambiguity. Invalid questions are filtered out before being presented to the student.',
    color: 'from-[#EC4899] to-[#F472B6]',
    iconBg: 'bg-[#EC4899]/10',
    iconColor: 'text-[#EC4899]',
  },
  {
    step: 5,
    icon: Zap,
    title: 'Adaptive Difficulty Engine',
    description:
      'During the quiz, the engine monitors student performance in real-time using a sliding window of recent answers. After 3 consecutive correct answers, difficulty increases. After 3 consecutive wrong answers, it decreases. This ensures every student is challenged at the right level.',
    color: 'from-purple-500 to-purple-400',
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
  },
];

const techCards = [
  {
    title: 'Gemma 4 Multimodal',
    description: 'Google\'s latest multimodal model capable of understanding both text and images with exceptional accuracy.',
    icon: Brain,
    color: 'text-[#2563EB]',
  },
  {
    title: 'Function Calling',
    description: 'Structured output generation ensures consistent, parseable quiz question formats with metadata.',
    icon: Cpu,
    color: 'text-[#0D9488]',
  },
  {
    title: 'Vision AI',
    description: 'Advanced OCR and visual understanding for diagrams, equations, tables, and handwritten content.',
    icon: Camera,
    color: 'text-[#F59E0B]',
  },
  {
    title: 'Adaptive Learning',
    description: 'Difficulty calibration based on student performance for personalized learning paths.',
    icon: Zap,
    color: 'text-purple-500',
  },
];

export function HowItWorksPage() {
  const { setView } = useQuizStore();

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="flex-1"
    >
      {/* Hero */}
      <section className="bg-gradient-to-b from-teal-50/60 via-white to-blue-50/40 px-4 pb-12 pt-12 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div variants={fadeInUp}>
            <Badge variant="outline" className="mb-4 border-[#0D9488]/20 bg-[#0D9488]/5 text-[#0D9488]">
              <Layers className="mr-1 h-3 w-3" />
              Architecture
            </Badge>
          </motion.div>
          <motion.h1
            variants={fadeInUp}
            className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl"
          >
            How <span className="text-[#2563EB]">ScanLearn</span> Works
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            className="mx-auto max-w-2xl text-lg text-muted-foreground"
          >
            A deep dive into the AI-powered pipeline that transforms textbook images
            into adaptive, personalized quizzes.
          </motion.p>
        </div>
      </section>

      {/* Pipeline Steps */}
      <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div variants={fadeInUp} className="mb-12 text-center">
            <h2 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
              The Pipeline
            </h2>
            <p className="text-muted-foreground">
              Five stages from image to interactive quiz
            </p>
          </motion.div>

          <div className="space-y-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div key={step.step} variants={fadeInUp}>
                  <Card className="overflow-hidden border-border/50 hover:shadow-lg transition-shadow">
                    <div className="flex flex-col sm:flex-row">
                      <div className={`flex shrink-0 items-center justify-center p-6 sm:w-24 bg-gradient-to-br ${step.color} text-white`}>
                        <div className="text-center">
                          <Icon className="mx-auto mb-1 h-8 w-8" />
                          <span className="text-xs font-bold opacity-80">
                            STEP {step.step}
                          </span>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <h3 className="mb-2 text-lg font-bold">{step.title}</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {step.description}
                        </p>
                      </CardContent>
                    </div>
                  </Card>
                  {i < steps.length - 1 && (
                    <div className="flex justify-center py-2">
                      <div className="h-8 w-0.5 bg-gradient-to-b from-muted-foreground/20 to-muted-foreground/10" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="bg-muted/30 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div variants={fadeInUp} className="mb-12 text-center">
            <h2 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Powered By
            </h2>
            <p className="text-muted-foreground">
              Core technologies behind ScanLearn
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2">
            {techCards.map((card) => {
              const Icon = card.icon;
              return (
                <motion.div key={card.title} variants={fadeInUp}>
                  <Card className="h-full border-border/50 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-center gap-3">
                        <Icon className={`h-8 w-8 ${card.color}`} />
                        <h3 className="text-lg font-bold">{card.title}</h3>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {card.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Architecture Diagram */}
      <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div variants={fadeInUp} className="mb-8 text-center">
            <h2 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
              System Architecture
            </h2>
            <p className="text-muted-foreground">
              Visual overview of the ScanLearn architecture
            </p>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className="relative rounded-lg bg-muted/20 p-4">
                  {/* Visual Architecture Diagram */}
                  <div className="mx-auto max-w-2xl space-y-4">
                    {/* User Input */}
                    <div className="rounded-xl border-2 border-dashed border-[#2563EB]/30 bg-[#2563EB]/5 p-4 text-center">
                      <Camera className="mx-auto mb-2 h-8 w-8 text-[#2563EB]" />
                      <p className="text-sm font-semibold text-[#2563EB]">Textbook Image Upload</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, WebP</p>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center">
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-0.5 bg-muted-foreground/30" />
                        <div className="h-0 w-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-muted-foreground/30" />
                      </div>
                    </div>

                    {/* AI Processing - 3-step pipeline */}
                    <div className="rounded-xl border-2 border-[#0D9488]/30 bg-gradient-to-r from-[#0D9488]/5 to-[#2563EB]/5 p-4">
                      <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                        <div className="flex flex-col items-center">
                          <div className="rounded-lg bg-[#0D9488]/10 p-2 sm:p-3">
                            <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-[#0D9488]" />
                          </div>
                          <p className="mt-1 text-[10px] sm:text-xs font-semibold text-center">1. analyze_content()</p>
                        </div>
                        <span className="text-muted-foreground">→</span>
                        <div className="flex flex-col items-center">
                          <div className="rounded-lg bg-[#F59E0B]/10 p-2 sm:p-3">
                            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-[#F59E0B]" />
                          </div>
                          <p className="mt-1 text-[10px] sm:text-xs font-semibold text-center">2. generate_question()</p>
                        </div>
                        <span className="text-muted-foreground">→</span>
                        <div className="flex flex-col items-center">
                          <div className="rounded-lg bg-[#EC4899]/10 p-2 sm:p-3">
                            <Cpu className="h-6 w-6 sm:h-8 sm:w-8 text-[#EC4899]" />
                          </div>
                          <p className="mt-1 text-[10px] sm:text-xs font-semibold text-center">3. validate_question()</p>
                        </div>
                        <span className="text-muted-foreground">→</span>
                        <div className="flex flex-col items-center">
                          <div className="rounded-lg bg-purple-500/10 p-2 sm:p-3">
                            <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
                          </div>
                          <p className="mt-1 text-[10px] sm:text-xs font-semibold text-center">Adaptive</p>
                        </div>
                      </div>
                      <p className="mt-3 text-center text-xs text-muted-foreground">
                        3-step Gemma 4 function calling pipeline
                      </p>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center">
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-0.5 bg-muted-foreground/30" />
                        <div className="h-0 w-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-muted-foreground/30" />
                      </div>
                    </div>

                    {/* Output */}
                    <div className="rounded-xl border-2 border-dashed border-green-500/30 bg-green-500/5 p-4 text-center">
                      <MessageSquare className="mx-auto mb-2 h-8 w-8 text-green-600" />
                      <p className="text-sm font-semibold text-green-600">Interactive Quiz</p>
                      <div className="mt-2 flex justify-center gap-2">
                        <Badge variant="outline" className="text-[10px] border-green-500/20 bg-green-500/5 text-green-600">MCQ</Badge>
                        <Badge variant="outline" className="text-[10px] border-green-500/20 bg-green-500/5 text-green-600">T/F</Badge>
                        <Badge variant="outline" className="text-[10px] border-green-500/20 bg-green-500/5 text-green-600">Fill Blank</Badge>
                        <Badge variant="outline" className="text-[10px] border-green-500/20 bg-green-500/5 text-green-600">Short Answer</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <motion.div variants={fadeInUp}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to Try It?
            </h2>
            <p className="mb-6 text-muted-foreground">
              Upload a textbook page and see the magic happen in real-time.
            </p>
            <Button
              size="lg"
              onClick={() => setView('generate')}
              className="gap-2 bg-[#2563EB] text-white hover:bg-[#2563EB]/90"
            >
              <Sparkles className="h-5 w-5" />
              Try ScanLearn Now
            </Button>
          </div>
        </motion.div>
      </section>
    </motion.div>
  );
}
