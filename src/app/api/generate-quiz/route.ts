import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import type { QuizQuestion } from '@/lib/types';

const sampleQuestions: QuizQuestion[] = [
  {
    type: 'mcq',
    id: 1,
    question: 'What is the primary function of the mitochondria in a cell?',
    options: ['Protein synthesis', 'Energy production (ATP)', 'Cell division', 'Waste removal'],
    correctAnswer: 1,
    explanation: 'Mitochondria are the "powerhouse of the cell," generating ATP through cellular respiration.',
  },
  {
    type: 'mcq',
    id: 2,
    question: 'Which organelle is responsible for photosynthesis?',
    options: ['Mitochondria', 'Golgi apparatus', 'Chloroplast', 'Endoplasmic reticulum'],
    correctAnswer: 2,
    explanation: 'Chloroplasts contain chlorophyll and are the site of photosynthesis.',
  },
  {
    type: 'true_false',
    id: 3,
    question: 'The cell membrane is selectively permeable.',
    correctAnswer: true,
    explanation: 'The cell membrane controls what enters and exits the cell, maintaining homeostasis.',
  },
  {
    type: 'true_false',
    id: 4,
    question: 'DNA is found exclusively in the nucleus of eukaryotic cells.',
    correctAnswer: false,
    explanation: 'Eukaryotic cells also contain mitochondrial DNA and, in plants, chloroplast DNA.',
  },
  {
    type: 'fill_blank',
    id: 5,
    question: 'The process of cell division producing two identical daughter cells is called __________.',
    correctAnswer: 'mitosis',
    explanation: 'Mitosis produces two genetically identical daughter cells.',
  },
  {
    type: 'mcq',
    id: 6,
    question: 'What is the role of ribosomes?',
    options: ['Energy production', 'Lipid synthesis', 'Protein synthesis', 'DNA replication'],
    correctAnswer: 2,
    explanation: 'Ribosomes translate mRNA into amino acid chains during protein synthesis.',
  },
  {
    type: 'short_answer',
    id: 7,
    question: 'Explain the difference between passive and active transport.',
    correctAnswer: 'Passive transport moves substances down their concentration gradient without energy. Active transport moves substances against their gradient, requiring ATP.',
    explanation: 'Passive transport requires no energy; active transport requires ATP.',
  },
  {
    type: 'fill_blank',
    id: 8,
    question: 'The __________ is the control center of the cell, containing the genetic material.',
    correctAnswer: 'nucleus',
    explanation: 'The nucleus contains DNA and controls gene expression.',
  },
  {
    type: 'mcq',
    id: 9,
    question: 'Which structure provides structural support to plant cells?',
    options: ['Cell membrane', 'Cytoplasm', 'Cell wall', 'Vacuole'],
    correctAnswer: 2,
    explanation: 'The cell wall is a rigid outer layer made of cellulose.',
  },
  {
    type: 'true_false',
    id: 10,
    question: 'Enzymes are consumed in the chemical reactions they catalyze.',
    correctAnswer: false,
    explanation: 'Enzymes are catalysts that speed up reactions without being consumed.',
  },
];

function buildPrompt(
  difficulty: string,
  numQuestions: number,
  questionTypes: string[],
  language: string
): string {
  const difficultyGuide: Record<string, string> = {
    beginner: 'Basic recall and understanding questions. Use simple vocabulary.',
    intermediate: 'Application and analysis questions. Require connecting concepts.',
    advanced: 'Critical thinking and evaluation questions. Require deep understanding and reasoning.',
  };

  const typeGuide: Record<string, string> = {
    mcq: 'Multiple Choice Questions (with 4 options labeled A-D)',
    true_false: 'True or False questions',
    fill_blank: 'Fill in the Blank questions',
    short_answer: 'Short Answer questions (requiring 1-2 sentences)',
  };

  const typeDescriptions = questionTypes
    .map((t) => typeGuide[t] || t)
    .join(', ');

  return `You are an expert educator. I will show you an image of a textbook page. Your task is to:

1. Carefully read and understand ALL the content on this textbook page
2. Generate exactly ${numQuestions} quiz questions based on the content
3. Use these question types: ${typeDescriptions}
4. Difficulty level: ${difficulty} — ${difficultyGuide[difficulty] || difficultyGuide.intermediate}
5. Generate the quiz in ${language}
6. For each question, provide a clear explanation of the correct answer

IMPORTANT: Return ONLY a valid JSON array with NO markdown formatting, NO code blocks, NO backticks. The JSON must be a valid array.

Each question object must have this structure:
- For MCQ: {"type":"mcq","id":NUMBER,"question":"...","options":["A","B","C","D"],"correctAnswer":INDEX,"explanation":"..."}
- For True/False: {"type":"true_false","id":NUMBER,"question":"...","correctAnswer":true/false,"explanation":"..."}
- For Fill-in-blank: {"type":"fill_blank","id":NUMBER,"question":"...with _____ blank","correctAnswer":"the answer","explanation":"..."}
- For Short Answer: {"type":"short_answer","id":NUMBER,"question":"...","correctAnswer":"expected answer","explanation":"..."}

The correctAnswer for MCQ must be the 0-based index of the correct option.
Start IDs from 1 and increment.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, difficulty = 'intermediate', numQuestions = 5, questionTypes = ['mcq'], language = 'English' } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    const prompt = buildPrompt(difficulty, numQuestions, questionTypes, language);

    try {
      const zai = await ZAI.create();

      const response = await zai.chat.completions.createVision({
        model: 'gemma-4',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: image,
                },
              },
            ],
          },
        ],
        thinking: { type: 'disabled' },
      });

      const content = response.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content in AI response');
      }

      // Try to parse the JSON from the response
      let questions: QuizQuestion[];

      // Extract JSON array from the response (handle markdown code blocks)
      let jsonStr = content.trim();

      // Remove markdown code blocks if present
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      // Try to find JSON array in the text
      const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        jsonStr = arrayMatch[0];
      }

      try {
        questions = JSON.parse(jsonStr);
      } catch {
        // If parsing fails, use sample data
        console.error('Failed to parse AI response as JSON:', jsonStr.substring(0, 200));
        throw new Error('Failed to parse quiz questions');
      }

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('No valid questions in response');
      }

      return NextResponse.json({ questions });
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      // Fallback to sample data
      const shuffled = [...sampleQuestions].sort(() => Math.random() - 0.5);
      const sliced = shuffled.slice(0, numQuestions);
      return NextResponse.json({ questions: sliced });
    }
  } catch (error) {
    console.error('Generate quiz error:', error);
    return NextResponse.json(
      { error: 'Failed to generate quiz. Please try again.' },
      { status: 500 }
    );
  }
}
