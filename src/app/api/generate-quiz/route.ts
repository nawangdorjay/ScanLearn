import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { QuizQuestion } from '@/lib/types';

// Initialize Google Generative AI with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

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

/**
 * Helper: Extract base64 data from a data URL or raw base64 string
 */
function extractBase64(image: string): { mimeType: string; data: string } {
  if (image.startsWith('data:')) {
    const [header, data] = image.split(',');
    const mimeType = header.match(/data:(.*?);/)?.[1] || 'image/png';
    return { mimeType, data };
  }
  return { mimeType: 'image/png', data: image };
}

/**
 * Helper: Parse JSON from AI response (handles markdown code blocks)
 */
function parseJSONResponse(content: string): unknown {
  let jsonStr = content.trim();
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1].trim();
  const objMatch = jsonStr.match(/\{[\s\S]*\}/);
  const arrMatch = jsonStr.match(/\[[\s\S]*\]/);
  if (objMatch && arrMatch) {
    // Return whichever comes first
    jsonStr = objMatch.index! < arrMatch.index! ? objMatch[0] : arrMatch[0];
  } else if (objMatch) {
    jsonStr = objMatch[0];
  } else if (arrMatch) {
    jsonStr = arrMatch[0];
  }
  return JSON.parse(jsonStr);
}

/**
 * Call Gemma 4 multimodal model with text + image
 */
async function callGemma4(prompt: string, image: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemma-4-26b-a4b-it' });
  const { mimeType, data } = extractBase64(image);

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType,
        data,
      },
    },
  ]);

  const response = result.response;
  const text = response.text();
  if (!text) throw new Error('Empty response from Gemma 4');
  return text;
}

/**
 * STEP 1: analyze_content()
 * Uses Gemma 4 multimodal vision to extract key concepts, topics,
 * and learning objectives from the textbook page image.
 */
async function analyzeContent(image: string, language: string) {
  const prompt = `You are an expert educational content analyzer. I will show you an image of a textbook page.

Your task is to perform a thorough content analysis. Extract and return a JSON object with these fields:

1. "topics": array of main topics covered (strings)
2. "keyConcepts": array of key concepts and terminology (strings)
3. "learningObjectives": array of what a student should learn from this page (strings)
4. "contentSummary": a brief summary of the page content (string)
5. "difficultyIndicators": object with "estimatedLevel" ("beginner", "intermediate", or "advanced") and "reasoning" (string)
6. "contentSegments": array of specific content segments that could be used for quiz questions, each with "segment" (string) and "potentialQuestionType" (one of: "mcq", "true_false", "fill_blank", "short_answer")

Analyze ALL content including text, diagrams, tables, and mathematical expressions.
Respond in ${language} for topics and concepts, but keep JSON keys in English.

Return ONLY valid JSON with NO markdown, NO code blocks, NO backticks.`;

  const content = await callGemma4(prompt, image);
  return parseJSONResponse(content) as Record<string, unknown>;
}

/**
 * STEP 2: generate_question()
 * Uses the content analysis from Step 1 to generate structured quiz questions.
 * Each question includes an explicit difficulty rating for adaptive engine use.
 */
async function generateQuestions(
  image: string,
  contentAnalysis: Record<string, unknown>,
  difficulty: string,
  numQuestions: number,
  questionTypes: string[],
  language: string
) {
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

  const prompt = `You are an expert educator creating adaptive quizzes. I have already analyzed the textbook page content.

CONTENT ANALYSIS:
${JSON.stringify(contentAnalysis, null, 2)}

Now generate exactly ${numQuestions} quiz questions based on this analysis.

Requirements:
- Use these question types: ${typeDescriptions}
- Base difficulty: ${difficulty} — ${difficultyGuide[difficulty] || difficultyGuide.intermediate}
- Generate questions in ${language}
- For each question, provide a clear explanation
- IMPORTANT: Include a "difficultyRating" field for each question with one of: "easy", "medium", "hard"
  - Mix difficulty levels: roughly 30% easy, 40% medium, 30% hard to enable adaptive selection
- Include a "topicTag" field for each question identifying which topic from the analysis it relates to

Return ONLY a valid JSON array with NO markdown formatting, NO code blocks, NO backticks.

Each question object must have this structure:
- For MCQ: {"type":"mcq","id":NUMBER,"question":"...","options":["A","B","C","D"],"correctAnswer":INDEX,"explanation":"...","difficultyRating":"easy|medium|hard","topicTag":"..."}
- For True/False: {"type":"true_false","id":NUMBER,"question":"...","correctAnswer":true/false,"explanation":"...","difficultyRating":"easy|medium|hard","topicTag":"..."}
- For Fill-in-blank: {"type":"fill_blank","id":NUMBER,"question":"...with _____ blank","correctAnswer":"the answer","explanation":"...","difficultyRating":"easy|medium|hard","topicTag":"..."}
- For Short Answer: {"type":"short_answer","id":NUMBER,"question":"...","correctAnswer":"expected answer","explanation":"...","difficultyRating":"easy|medium|hard","topicTag":"..."}

The correctAnswer for MCQ must be the 0-based index of the correct option.
Start IDs from 1 and increment.`;

  const content = await callGemma4(prompt, image);
  return parseJSONResponse(content) as QuizQuestion[];
}

/**
 * STEP 3: validate_question()
 * Validates each generated question against the source content analysis
 * to ensure they are answerable and grounded in the material.
 */
async function validateQuestions(
  image: string,
  questions: QuizQuestion[],
  contentAnalysis: Record<string, unknown>
) {
  const prompt = `You are a quiz quality validator. I will show you a textbook page image, its content analysis, and generated quiz questions.

CONTENT ANALYSIS:
${JSON.stringify(contentAnalysis, null, 2)}

GENERATED QUESTIONS:
${JSON.stringify(questions, null, 2)}

Validate each question. Return a JSON array of objects with:
- "id": the question ID
- "isValid": boolean (true if the question is answerable from the page content and not ambiguous)
- "issues": array of strings describing any problems (empty if valid)
- "suggestedFix": string with a fix suggestion if issues exist (empty string if valid)

Be strict but fair. A question is valid if a student who read the page could reasonably answer it.
Return ONLY valid JSON array with NO markdown, NO code blocks, NO backticks.`;

  const content = await callGemma4(prompt, image);
  return parseJSONResponse(content) as { id: number; isValid: boolean; issues: string[]; suggestedFix: string }[];
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

    if (!process.env.GOOGLE_AI_API_KEY) {
      console.warn('GOOGLE_AI_API_KEY not set, using sample fallback');
      const shuffled = [...sampleQuestions].sort(() => Math.random() - 0.5);
      return NextResponse.json({
        questions: shuffled.slice(0, numQuestions),
        pipeline: {
          stages: ['analyze_content', 'generate_question', 'validate_question'],
          error: 'API key not configured',
          usedFallback: true,
        },
      });
    }

    let pipelineStage = 'init';
    let contentAnalysis: Record<string, unknown> | null = null;

    try {
      // ============================================================
      // STEP 1: analyze_content() — Extract key concepts from image
      // ============================================================
      pipelineStage = 'analyze_content';
      console.log('[Pipeline] Step 1: analyze_content() — Extracting key concepts from image...');
      contentAnalysis = await analyzeContent(image, language);
      console.log('[Pipeline] Step 1 complete. Topics:', (contentAnalysis.topics as string[])?.join(', '));

      // ============================================================
      // STEP 2: generate_question() — Generate quiz questions
      // ============================================================
      pipelineStage = 'generate_question';
      console.log('[Pipeline] Step 2: generate_question() — Creating quiz questions...');
      let questions: QuizQuestion[] = await generateQuestions(
        image, contentAnalysis, difficulty, numQuestions, questionTypes, language
      );
      console.log(`[Pipeline] Step 2 complete. Generated ${questions.length} questions.`);

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('No valid questions generated');
      }

      // ============================================================
      // STEP 3: validate_question() — Validate against source
      // ============================================================
      pipelineStage = 'validate_question';
      console.log('[Pipeline] Step 3: validate_question() — Validating questions against source...');
      const validationResults = await validateQuestions(image, questions, contentAnalysis);

      // Filter out invalid questions
      const validQuestions = questions.filter((q) => {
        const validation = validationResults.find((v) => v.id === q.id);
        return validation?.isValid !== false;
      });

      const removedCount = questions.length - validQuestions.length;
      console.log(`[Pipeline] Step 3 complete. ${validQuestions.length}/${questions.length} questions passed validation.`);

      // If validation removed too many questions, fall back to originals
      const finalQuestions = validQuestions.length >= 2 ? validQuestions : questions;

      return NextResponse.json({
        questions: finalQuestions,
        pipeline: {
          stages: ['analyze_content', 'generate_question', 'validate_question'],
          contentAnalysis: {
            topics: contentAnalysis.topics,
            keyConcepts: contentAnalysis.keyConcepts,
            learningObjectives: contentAnalysis.learningObjectives,
          },
          validation: {
            totalGenerated: questions.length,
            passedValidation: validQuestions.length,
            removedCount,
          },
        },
      });
    } catch (aiError) {
      console.error(`AI pipeline error at stage '${pipelineStage}':`, aiError);
      const shuffled = [...sampleQuestions].sort(() => Math.random() - 0.5);
      const sliced = shuffled.slice(0, numQuestions);
      return NextResponse.json({
        questions: sliced,
        pipeline: {
          stages: ['analyze_content', 'generate_question', 'validate_question'],
          error: `Pipeline failed at: ${pipelineStage}`,
          usedFallback: true,
        },
      });
    }
  } catch (error) {
    console.error('Generate quiz error:', error);
    return NextResponse.json(
      { error: 'Failed to generate quiz. Please try again.' },
      { status: 500 }
    );
  }
}
