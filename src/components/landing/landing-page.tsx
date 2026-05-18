'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Camera,
  Cpu,
  Globe,
  Lock,
  Sparkles,
  Upload,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQuizStore } from '@/store/quiz-store';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } },
};

export function LandingPage() {
  const { setView } = useQuizStore();

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="flex-1"
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/80 via-white to-teal-50/40 px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8">
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-[#2563EB]/5 blur-3xl" />
          <div className="absolute -left-40 top-60 h-80 w-80 rounded-full bg-[#0D9488]/5 blur-3xl" />
          <div className="absolute -bottom-20 right-1/4 h-60 w-60 rounded-full bg-[#F59E0B]/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div variants={fadeInUp}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#2563EB]/20 bg-[#2563EB]/5 px-4 py-1.5 text-sm font-medium text-[#2563EB]">
              <Sparkles className="h-4 w-4" />
              Powered by Gemma 4 Multimodal AI
            </div>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
          >
            <span className="text-[#2563EB]">Transform</span> Any Textbook{' '}
            <br className="hidden sm:block" />
            Into an{' '}
            <span className="bg-gradient-to-r from-[#2563EB] to-[#0D9488] bg-clip-text text-transparent">
              Adaptive Quiz
            </span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            Scan any textbook page, and our AI-powered engine generates
            personalized quizzes that adapt to your learning level. Study smarter,
            not harder.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button
              size="lg"
              onClick={() => setView('generate')}
              className="h-13 gap-2 bg-[#2563EB] px-8 text-base font-semibold text-white hover:bg-[#2563EB]/90"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setView('how-it-works')}
              className="h-13 px-8 text-base"
            >
              How It Works
            </Button>
          </motion.div>
        </div>
      </section>

      {/* 3-Step Process */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.div
            variants={fadeInUp}
            className="mb-12 text-center"
          >
            <h2 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Three Simple Steps
            </h2>
            <p className="text-muted-foreground">
              From textbook page to personalized quiz in seconds
            </p>
          </motion.div>

          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: '01',
                icon: Camera,
                title: 'Upload',
                description:
                  'Take a photo or upload an image of any textbook page. Our system accepts PNG, JPG, and WebP formats.',
                color: 'bg-[#2563EB]',
              },
              {
                step: '02',
                icon: Cpu,
                title: 'Generate',
                description:
                  'Gemma 4 Multimodal AI reads the content and creates structured quiz questions tailored to your level.',
                color: 'bg-[#0D9488]',
              },
              {
                step: '03',
                icon: BookOpen,
                title: 'Learn',
                description:
                  'Take the interactive quiz, get instant feedback, and review explanations to master every concept.',
                color: 'bg-[#F59E0B]',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <motion.div key={item.step} variants={fadeInUp}>
                  <Card className="group relative overflow-hidden border-border/50 py-0 transition-all hover:border-border hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-center gap-3">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.color} text-white shadow-lg`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <span className="text-3xl font-extrabold text-muted-foreground/20">
                          {item.step}
                        </span>
                      </div>
                      <h3 className="mb-2 text-xl font-bold">{item.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.div
            variants={fadeInUp}
            className="mb-12 text-center"
          >
            <h2 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Powerful Features
            </h2>
            <p className="text-muted-foreground">
              Everything you need for an effective study session
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2">
            {[
              {
                icon: Camera,
                title: 'Multimodal AI Vision',
                description:
                  'Gemma 4 reads and understands textbook images — diagrams, equations, tables, and text — to generate relevant questions.',
                gradient: 'from-[#2563EB]/10 to-[#2563EB]/5',
                iconColor: 'text-[#2563EB]',
              },
              {
                icon: Zap,
                title: 'Adaptive Difficulty',
                description:
                  'Choose from Beginner, Intermediate, and Advanced levels. Questions are tailored to challenge you at the right level.',
                gradient: 'from-[#0D9488]/10 to-[#0D9488]/5',
                iconColor: 'text-[#0D9488]',
              },
              {
                icon: Globe,
                title: 'Multi-language Support',
                description:
                  'Generate quizzes in English, Spanish, French, German, Chinese, Japanese, and more. Learn in your preferred language.',
                gradient: 'from-[#F59E0B]/10 to-[#F59E0B]/5',
                iconColor: 'text-[#F59E0B]',
              },
              {
                icon: Lock,
                title: 'Privacy-First',
                description:
                  'Your data stays private. Images are processed on-demand and not stored. No accounts required to get started.',
                gradient: 'from-purple-500/10 to-purple-500/5',
                iconColor: 'text-purple-500',
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div key={feature.title} variants={fadeInUp}>
                  <Card className="group h-full border-border/50 transition-all hover:border-border hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-center gap-4">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient}`}
                        >
                          <Icon className={`h-6 w-6 ${feature.iconColor}`} />
                        </div>
                        <h3 className="text-lg font-bold">{feature.title}</h3>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <motion.div variants={fadeInUp}>
          <Card className="overflow-hidden border-0 bg-gradient-to-r from-[#2563EB] to-[#0D9488] text-white">
            <CardContent className="px-6 py-12 text-center sm:px-12 sm:py-16">
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                Ready to Transform Your Study Sessions?
              </h2>
              <p className="mx-auto mb-8 max-w-xl text-lg text-white/80">
                Upload any textbook page and get a personalized quiz in seconds.
                No sign-up required.
              </p>
              <Button
                size="lg"
                onClick={() => setView('generate')}
                className="h-13 gap-2 bg-white px-8 text-base font-semibold text-[#2563EB] hover:bg-white/90"
              >
                <Upload className="h-5 w-5" />
                Start Generating Quizzes
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </motion.div>
  );
}
