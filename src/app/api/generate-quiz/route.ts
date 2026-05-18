import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { QuizQuestion } from '@/lib/types';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Model priority list — try each until one works
const MODELS = [
  'gemma-4-26b-a4b-it',   // Primary: Gemma 4 for hackathon
  'gemini-2.0-flash',       // Fallback 1: Stable multimodal, very fast
  'gemini-2.0-flash-lite',  // Fallback 2: Even lighter
];

const sampleQuestions: QuizQuestion[] = [
  {
    type: 'mcq', id: 1,
    question: 'What is the primary function of the mitochondria in a cell?',
    options: ['Protein synthesis', 'Energy production (ATP)', 'Cell division', 'Waste removal'],
    correctAnswer: 1,
    explanation: 'Mitochondria are the "powerhouse of the cell," generating ATP through cellular respiration.',
  },
  {
    type: 'mcq', id: 2,
    question: 'Which organelle is responsible for photosynthesis?',
    options: ['Mitochondria', 'Golgi apparatus', 'Chloroplast', 'Endoplasmic reticulum'],
    correctAnswer: 2,
    explanation: 'Chloroplasts contain chlorophyll and are the site of photosynthesis.',
  },
  {
    type: 'true_false', id: 3,
    question: 'The cell membrane is selectively permeable.',
    correctAnswer: true,
    explanation: 'The cell membrane controls what enters and exits the cell, maintaining homeostasis.',
  },
  {
    type: 'true_false', id: 4,
    question: 'DNA is found exclusively in the nucleus of eukaryotic cells.',
    correctAnswer: false,
    explanation: 'Eukaryotic cells also contain mitochondrial DNA and, in plants, chloroplast DNA.',
  },
  {
    type: 'fill_blank', id: 5,
    question: 'The process of cell division producing two identical daughter cells is called __________.',
    correctAnswer: 'mitosis',
    explanation: 'Mitosis produces two genetically identical daughter cells.',
  },
  {
    type: 'mcq', id: 6,
    question: 'What is the role of ribosomes?',
    options: ['Energy production', 'Lipid synthesis', 'Protein synthesis', 'DNA replication'],
    correctAnswer: 2,
    explanation: 'Ribosomes translate mRNA into amino acid chains during protein synthesis.',
  },
  {
    type: 'short_answer', id: 7,
    question: 'Explain the difference between passive and active transport.',
    correctAnswer: 'Passive transport moves substances down their concentration gradient without energy. Active transport moves substances against their gradient, requiring ATP.',
    explanation: 'Passive transport requires no energy; active transport requires ATP.',
  },
  {
    type: 'fill_blank', id: 8,
    question: 'The __________ is the control center of the cell, containing the genetic material.',
    correctAnswer: 'nucleus',
    explanation: 'The nucleus contains DNA and controls gene expression.',
  },
  {
    type: 'mcq', id: 9,
    question: 'Which structure provides structural support to plant cells?',
    options: ['Cell membrane', 'Cytoplasm', 'Cell wall', 'Vacuole'],
    correctAnswer: 2,
    explanation: 'The cell wall is a rigid outer layer made of cellulose.',
  },
  {
    type: 'true_false', id: 10,
    question: 'Enzymes are consumed in the chemical reactions they catalyze.',
    correctAnswer: false,
    explanation: 'Enzymes are catalysts that speed up reactions without being consumed.',
  },
];

function extractBase64(image: string): { mimeType: string; data: string } {
  if (image.startsWith('data:')) {
    const [header, data] = image.split(',');
    const mimeType = header.match(/data:(.*?);/)?.[1] || 'image/png';
    return { mimeType, data };
  }
  return { mimeType: 'image/png', data: image };
}

function extractJSON(rawContent: string, stageName: string): unknown {
  if (!rawContent || rawContent.trim().length === 0) {
    throw new Error(`Empty response from ${stageName}`);
  }

  const trimmed = rawContent.trim();
  console.log(`[${stageName}] Raw (${trimmed.length} chars):`, trimmed.substring(0, 500));

  // Strategy 1: Direct parse
  try {
    return JSON.parse(trimmed);
  } catch { /* continue */ }

  // Strategy 2: Extract from code block
  const codeMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeMatch) {
    try { return JSON.parse(codeMatch[1].trim()); } catch { /* continue */ }
  }

  // Strategy 3: Balanced bracket extraction
  const startBrace = trimmed.indexOf('{');
  const startBracket = trimmed.indexOf('[');
  let startIdx = -1, openChar = '', closeChar = '';

  if (startBrace !== -1 && (startBracket === -1 || startBrace < startBracket)) {
    startIdx = startBrace; openChar = '{'; closeChar = '}';
  } else if (startBracket !== -1) {
    startIdx = startBracket; openChar = '['; closeChar = ']';
  }

  if (startIdx === -1) throw new Error(`No JSON in ${stageName}. Raw: ${trimmed.substring(0, 300)}`);

  let depth = 0, inStr = false, esc = false, endIdx = -1;
  for (let i = startIdx; i < trimmed.length; i++) {
    const c = trimmed[i];
    if (esc) { esc = false; continue; }
    if (c === '\\') { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === openChar) depth++;
    if (c === closeChar) depth--;
    if (depth === 0) { endIdx = i + 1; break; }
  }

  if (endIdx === -1) throw new Error(`Unbalanced JSON in ${stageName}`);

  let extracted = trimmed.substring(startIdx, endIdx)
    .replace(/,\s*([\]}])/g, '$1')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

  return JSON.parse(extracted);
}

/**
 * Try multiple models until one succeeds.
 */
async function callModel(prompt: string, image: string, stageName: string): Promise<{ text: string; model: string }> {
  const { mimeType, data } = extractBase64(image);

  for (const modelName of MODELS) {
    try {
      console.log(`[${stageName}] Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent([
        { inlineData: { mimeType, data } },
        { text: prompt },
      ]);

      const text = result.response.text();
      if (!text || text.trim().length === 0) {
        console.warn(`[${stageName}] ${modelName} returned empty response, trying next...`);
        continue;
      }

      console.log(`[${stageName}] Success with ${modelName} (${text.length} chars)`);
      return { text, model: modelName };
    } catch (error: unknown) {
      const err = error as Error & { status?: number };
      console.error(`[${stageName}] ${modelName} failed: HTTP ${err.status || 'N/A'} — ${err.message?.substring(0, 150)}`);
      // Continue to next model
    }
  }

  throw new Error(`All models failed for ${stageName}`);
}

// ─── STEP 1: analyze_content() ───
async function analyzeContent(image: string, language: string, usedModel: string) {
  const prompt = `You are an expert educational content analyzer. Analyze this textbook page image.

Return ONLY a valid JSON object with these fields:
{
  "topics": ["main topic 1", "main topic 2"],
  "keyConcepts": ["concept1", "concept2"],
  "learningObjectives": ["what student should learn 1"],
  "contentSummary": "brief summary of the page",
  "difficultyIndicators": {"estimatedLevel": "beginner|intermediate|advanced", "reasoning": "why"},
  "contentSegments": [{"segment": "text from page", "potentialQuestionType": "mcq|true_false|fill_blank|short_answer"}]
}

Analyze text, diagrams, tables, and math. Topics/concepts in ${language}, JSON keys in English.
Return ONLY the JSON object.`;

  const { text, model } = await callModel(prompt, image, 'analyze_content');
  usedModel = model;
  return { analysis: extractJSON(text, 'analyze_content') as Record<string, unknown>, model: usedModel };
}

// ─── STEP 2: generate_question() ───
async function generateQuestions(
  image: string,
  contentAnalysis: Record<string, unknown>,
  difficulty: string,
  numQuestions: number,
  questionTypes: string[],
  language: string
) {
  const diffDesc: Record<string, string> = {
    beginner: 'Basic recall. Simple vocabulary.',
    intermediate: 'Application and analysis.',
    advanced: 'Critical thinking. Deep reasoning.',
  };
  const types = questionTypes.map(t => ({ mcq: 'MCQ (4 options)', true_false: 'True/False', fill_blank: 'Fill Blank', short_answer: 'Short Answer' }[t] || t)).join(', ');

  const prompt = `You are an expert quiz creator. Analyzed textbook content:
${JSON.stringify(contentAnalysis, null, 2)}

Generate exactly ${numQuestions} quiz questions. Return ONLY a JSON array. No explanation.

[
  {"type":"mcq","id":1,"question":"What is X?","options":["A","B","C","D"],"correctAnswer":0,"explanation":"Because...","difficultyRating":"easy","topicTag":"topic"},
  {"type":"true_false","id":2,"question":"Statement?","correctAnswer":true,"explanation":"...","difficultyRating":"medium","topicTag":"topic"}
]

Rules:
- Types: ${types}
- Difficulty: ${difficulty} (${diffDesc[difficulty] || diffDesc.intermediate})
- Language: ${language}
- Each needs: explanation, difficultyRating (easy/medium/hard), topicTag
- ~30% easy, 40% medium, 30% hard
- MCQ correctAnswer = 0-based index. IDs from 1.
Return ONLY the JSON array.`;

  const { text } = await callModel(prompt, image, 'generate_question');
  const parsed = extractJSON(text, 'generate_question');

  if (Array.isArray(parsed)) return parsed as QuizQuestion[];
  if (parsed && typeof parsed === 'object') {
    for (const key of ['questions', 'results', 'data']) {
      if (key in parsed && Array.isArray((parsed as Record<string, unknown>)[key])) {
        return (parsed as Record<string, QuizQuestion[]>)[key];
      }
    }
  }
  throw new Error('generate_question did not return array');
}

// ─── STEP 3: validate_question() ───
async function validateQuestions(
  image: string,
  questions: QuizQuestion[],
  contentAnalysis: Record<string, unknown>
) {
  const prompt = `Validate these quiz questions against the textbook page analysis.

Analysis: ${JSON.stringify(contentAnalysis, null, 2)}
Questions: ${JSON.stringify(questions, null, 2)}

Return ONLY a JSON array:
[{"id":1,"isValid":true,"issues":[],"suggestedFix":""}]

isValid = true if answerable from page. Return ONLY the JSON array.`;

  const { text } = await callModel(prompt, image, 'validate_question');
  const parsed = extractJSON(text, 'validate_question');

  if (Array.isArray(parsed)) return parsed as { id: number; isValid: boolean; issues: string[]; suggestedFix: string }[];
  throw new Error('validate_question did not return array');
}

// ─── POST Handler ───
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, difficulty = 'intermediate', numQuestions = 5, questionTypes = ['mcq'], language = 'English' } = body;

    if (!image) return NextResponse.json({ error: 'No image provided' }, { status: 400 });

    if (!process.env.GOOGLE_AI_API_KEY) {
      console.warn('[Pipeline] No API key, fallback');
      const shuffled = [...sampleQuestions].sort(() => Math.random() - 0.5);
      return NextResponse.json({
        questions: shuffled.slice(0, numQuestions),
        pipeline: { stages: ['analyze_content', 'generate_question', 'validate_question'], error: 'API key not configured', usedFallback: true },
      });
    }

    let pipelineStage = 'init';
    let usedModel = 'none';

    try {
      pipelineStage = 'analyze_content';
      console.log('[Pipeline] Step 1/3: analyze_content()');
      const { analysis, model: m1 } = await analyzeContent(image, language, usedModel);
      usedModel = m1;
      const contentAnalysis = analysis;
      console.log('[Pipeline] Step 1 OK. Topics:', (contentAnalysis.topics as string[])?.join(', '));

      pipelineStage = 'generate_question';
      console.log('[Pipeline] Step 2/3: generate_question()');
      const questions: QuizQuestion[] = await generateQuestions(image, contentAnalysis, difficulty, numQuestions, questionTypes, language);
      console.log(`[Pipeline] Step 2 OK. ${questions.length} questions.`);

      if (!Array.isArray(questions) || questions.length === 0) throw new Error('No questions generated');

      pipelineStage = 'validate_question';
      console.log('[Pipeline] Step 3/3: validate_question()');
      const validation = await validateQuestions(image, questions, contentAnalysis);

      const valid = questions.filter(q => validation.find(v => v.id === q.id)?.isValid !== false);
      const removed = questions.length - valid.length;
      console.log(`[Pipeline] Step 3 OK. ${valid.length}/${questions.length} passed.`);

      const final = valid.length >= 2 ? valid : questions;

      return NextResponse.json({
        questions: final,
        pipeline: {
          stages: ['analyze_content', 'generate_question', 'validate_question'],
          model: usedModel,
          contentAnalysis: {
            topics: contentAnalysis.topics,
            keyConcepts: contentAnalysis.keyConcepts,
            learningObjectives: contentAnalysis.learningObjectives,
          },
          validation: { totalGenerated: questions.length, passedValidation: valid.length, removedCount: removed },
        },
      });
    } catch (aiError) {
      const err = aiError as Error;
      console.error(`[Pipeline] Failed at ${pipelineStage}: ${err.message}`);
      const shuffled = [...sampleQuestions].sort(() => Math.random() - 0.5);
      return NextResponse.json({
        questions: shuffled.slice(0, numQuestions),
        pipeline: {
          stages: ['analyze_content', 'generate_question', 'validate_question'],
          error: `Failed at ${pipelineStage}: ${err.message?.substring(0, 100)}`,
          usedFallback: true,
        },
      });
    }
  } catch (error) {
    console.error('[Pipeline] Error:', error);
    return NextResponse.json({ error: 'Failed to generate quiz.' }, { status: 500 });
  }
}
