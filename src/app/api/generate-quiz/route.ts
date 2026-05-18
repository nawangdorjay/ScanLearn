import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { QuizQuestion } from '@/lib/types';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Vision models (for Step 1 — needs to read image)
const VISION_MODELS = [
  'gemma-4-26b-a4b-it',
  'gemini-2.0-flash',
];

// Text-only models (for Steps 2+3 — only needs text analysis, NOT image)
const TEXT_MODELS = [
  'gemma-4-26b-a4b-it',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

const sampleQuestions: QuizQuestion[] = [
  { type: 'mcq', id: 1, question: 'What is the primary function of the mitochondria in a cell?', options: ['Protein synthesis', 'Energy production (ATP)', 'Cell division', 'Waste removal'], correctAnswer: 1, explanation: 'Mitochondria are the "powerhouse of the cell," generating ATP through cellular respiration.' },
  { type: 'mcq', id: 2, question: 'Which organelle is responsible for photosynthesis?', options: ['Mitochondria', 'Golgi apparatus', 'Chloroplast', 'Endoplasmic reticulum'], correctAnswer: 2, explanation: 'Chloroplasts contain chlorophyll and are the site of photosynthesis.' },
  { type: 'true_false', id: 3, question: 'The cell membrane is selectively permeable.', correctAnswer: true, explanation: 'The cell membrane controls what enters and exits the cell, maintaining homeostasis.' },
  { type: 'true_false', id: 4, question: 'DNA is found exclusively in the nucleus of eukaryotic cells.', correctAnswer: false, explanation: 'Eukaryotic cells also contain mitochondrial DNA and, in plants, chloroplast DNA.' },
  { type: 'fill_blank', id: 5, question: 'The process of cell division producing two identical daughter cells is called __________.', correctAnswer: 'mitosis', explanation: 'Mitosis produces two genetically identical daughter cells.' },
  { type: 'mcq', id: 6, question: 'What is the role of ribosomes?', options: ['Energy production', 'Lipid synthesis', 'Protein synthesis', 'DNA replication'], correctAnswer: 2, explanation: 'Ribosomes translate mRNA into amino acid chains during protein synthesis.' },
  { type: 'short_answer', id: 7, question: 'Explain the difference between passive and active transport.', correctAnswer: 'Passive transport moves substances down their concentration gradient without energy. Active transport moves substances against their gradient, requiring ATP.', explanation: 'Passive transport requires no energy; active transport requires ATP.' },
  { type: 'fill_blank', id: 8, question: 'The __________ is the control center of the cell, containing the genetic material.', correctAnswer: 'nucleus', explanation: 'The nucleus contains DNA and controls gene expression.' },
  { type: 'mcq', id: 9, question: 'Which structure provides structural support to plant cells?', options: ['Cell membrane', 'Cytoplasm', 'Cell wall', 'Vacuole'], correctAnswer: 2, explanation: 'The cell wall is a rigid outer layer made of cellulose.' },
  { type: 'true_false', id: 10, question: 'Enzymes are consumed in the chemical reactions they catalyze.', correctAnswer: false, explanation: 'Enzymes are catalysts that speed up reactions without being consumed.' },
];

function extractBase64(image: string): { mimeType: string; data: string } {
  if (image.startsWith('data:')) {
    const [header, data] = image.split(',');
    const mimeType = header.match(/data:(.*?);/)?.[1] || 'image/png';
    return { mimeType, data };
  }
  return { mimeType: 'image/png', data: image };
}

/** Wait specified ms */
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * Bulletproof JSON extractor — balanced bracket matching only.
 * NEVER does direct JSON.parse on raw response.
 */
function extractJSON(raw: string, stage: string): unknown {
  if (!raw?.trim()) throw new Error(`Empty response from ${stage}`);

  const s = raw.trim();
  console.log(`[${stage}] RAW (${s.length} chars):`, s.substring(0, 800));

  // Try code block first
  const cb = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  let target = cb ? cb[1].trim() : s;

  // Find first { or [
  let start = -1, open = '', close = '';
  for (let i = 0; i < target.length; i++) {
    if (target[i] === '{') { start = i; open = '{'; close = '}'; break; }
    if (target[i] === '[') { start = i; open = '['; close = ']'; break; }
  }
  if (start === -1) throw new Error(`No JSON in ${stage}. Response: ${s.substring(0, 200)}`);

  // Balanced walk
  let depth = 0, inStr = false, esc = false, end = -1;
  for (let i = start; i < target.length; i++) {
    const c = target[i];
    if (esc) { esc = false; continue; }
    if (c === '\\' && inStr) { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === open) depth++;
    if (c === close) depth--;
    if (depth === 0) { end = i + 1; break; }
  }
  if (end === -1) throw new Error(`Unbalanced JSON in ${stage}`);

  let json = target.substring(start, end)
    .replace(/,\s*([\]}])/g, '$1')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

  console.log(`[${stage}] EXTRACTED (${json.length} chars):`, json.substring(0, 300));

  try { return JSON.parse(json); } catch {
    json = json.replace(/'/g, '"');
    try { return JSON.parse(json); } catch {
      throw new Error(`Parse failed in ${stage}. JSON: ${json.substring(0, 200)}`);
    }
  }
}

/**
 * Call a vision model (image + text)
 */
async function callVisionModel(prompt: string, image: string, stage: string): Promise<{ text: string; model: string }> {
  const { mimeType, data } = extractBase64(image);

  for (const modelName of VISION_MODELS) {
    for (let attempt = 0; attempt <= 1; attempt++) {
      try {
        console.log(`[${stage}] ${modelName} attempt ${attempt + 1}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([
          { inlineData: { mimeType, data } },
          { text: prompt },
        ]);
        const text = result.response.text();
        if (!text?.trim()) { console.warn(`[${stage}] ${modelName} empty`); continue; }
        console.log(`[${stage}] ${modelName} OK (${text.length} chars)`);
        return { text, model: modelName };
      } catch (err: unknown) {
        const e = err as Error & { status?: number };
        console.error(`[${stage}] ${modelName} FAIL: HTTP ${e.status || '?'} ${e.message?.substring(0, 80)}`);
        if (e.status === 429 && attempt < 1) { console.warn(`[${stage}] Rate limited, waiting 5s...`); await wait(5000); }
      }
    }
  }
  throw new Error(`All vision models failed for ${stage}`);
}

/**
 * Call a text-only model (NO image — much faster, separate rate limit pool)
 */
async function callTextModel(prompt: string, stage: string): Promise<{ text: string; model: string }> {
  for (const modelName of TEXT_MODELS) {
    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        console.log(`[${stage}] ${modelName} attempt ${attempt + 1}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (!text?.trim()) { console.warn(`[${stage}] ${modelName} empty`); continue; }
        console.log(`[${stage}] ${modelName} OK (${text.length} chars)`);
        return { text, model: modelName };
      } catch (err: unknown) {
        const e = err as Error & { status?: number };
        console.error(`[${stage}] ${modelName} FAIL: HTTP ${e.status || '?'} ${e.message?.substring(0, 80)}`);
        if ((e.status === 429 || e.status === 500) && attempt < 2) {
          const delay = (attempt + 1) * 5000;
          console.warn(`[${stage}] Waiting ${delay / 1000}s before retry...`);
          await wait(delay);
        }
      }
    }
  }
  throw new Error(`All text models failed for ${stage}`);
}

// ─── STEP 1: analyze_content() — VISION (reads image) ───
async function analyzeContent(image: string, language: string) {
  const prompt = `Analyze this textbook page image. Return ONLY a JSON object.

{
  "topics": ["topic1", "topic2"],
  "keyConcepts": ["concept1"],
  "learningObjectives": ["objective1"],
  "contentSummary": "brief summary",
  "difficultyIndicators": {"estimatedLevel": "beginner|intermediate|advanced", "reasoning": "why"},
  "contentSegments": [{"segment": "text from page", "potentialQuestionType": "mcq|true_false|fill_blank|short_answer"}]
}

Analyze text, diagrams, tables, math. Topics in ${language}, JSON keys in English. ONLY JSON.`;

  const { text, model } = await callVisionModel(prompt, image, 'analyze_content');
  return { analysis: extractJSON(text, 'analyze_content') as Record<string, unknown>, model };
}

// ─── STEP 2+3: generate + validate — TEXT ONLY (no image needed!) ───
async function generateAndValidate(
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

  const prompt = `You are an expert quiz creator AND validator. I already analyzed a textbook page.

CONTENT ANALYSIS:
${JSON.stringify(contentAnalysis, null, 2)}

Generate exactly ${numQuestions} validated quiz questions. Return ONLY a JSON array.

[
  {"type":"mcq","id":1,"question":"What is X?","options":["A","B","C","D"],"correctAnswer":0,"explanation":"Because...","difficultyRating":"easy","topicTag":"topic","isValid":true}
]

Rules:
- Types: ${types}
- Difficulty: ${difficulty} (${diffDesc[difficulty] || diffDesc.intermediate})
- Language: ${language}
- Each needs: explanation, difficultyRating (easy/medium/hard), topicTag, isValid
- isValid = true only if answerable from the content analysis
- Mix: ~30% easy, 40% medium, 30% hard
- MCQ correctAnswer = 0-based index. IDs from 1.
- Only include isValid=true questions
Return ONLY the JSON array.`;

  // Add 3s delay between Step 1 and Step 2 to avoid rate limits
  console.log('[generate_validate] Waiting 3s to avoid rate limit...');
  await wait(3000);

  const { text } = await callTextModel(prompt, 'generate_validate');
  const parsed = extractJSON(text, 'generate_validate');

  let questions: QuizQuestion[];
  if (Array.isArray(parsed)) {
    questions = parsed as QuizQuestion[];
  } else if (parsed && typeof parsed === 'object') {
    for (const key of ['questions', 'results', 'data']) {
      if (key in parsed && Array.isArray((parsed as Record<string, unknown>)[key])) {
        questions = (parsed as Record<string, QuizQuestion[]>)[key];
        break;
      }
    }
    if (!questions) throw new Error('No questions array found');
  } else {
    throw new Error('Unexpected format');
  }

  // Strip isValid field from output
  const clean = questions.map(({ isValid: _iv, ...rest }: Record<string, unknown>) => rest as unknown as QuizQuestion);
  return { questions: clean, totalGenerated: questions.length };
}

// ─── POST ───
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, difficulty = 'intermediate', numQuestions = 5, questionTypes = ['mcq'], language = 'English' } = body;

    if (!image) return NextResponse.json({ error: 'No image provided' }, { status: 400 });

    if (!process.env.GOOGLE_AI_API_KEY) {
      const shuffled = [...sampleQuestions].sort(() => Math.random() - 0.5);
      return NextResponse.json({
        questions: shuffled.slice(0, numQuestions),
        pipeline: { stages: ['analyze_content', 'generate_question', 'validate_question'], error: 'API key not configured', usedFallback: true },
      });
    }

    let pipelineStage = 'init';
    let usedModels: string[] = [];

    try {
      // STEP 1: analyze_content — VISION (reads image with Gemma 4)
      pipelineStage = 'analyze_content';
      console.log(`[Pipeline] v3 | Step 1: analyze_content (vision)`);
      const { analysis, model: m1 } = await analyzeContent(image, language);
      usedModels.push(m1);
      console.log(`[Pipeline] Step 1 OK via ${m1}`);

      // STEP 2+3: generate + validate — TEXT ONLY (no image, separate rate limit pool)
      pipelineStage = 'generate_validate';
      console.log(`[Pipeline] Step 2: generate_and_validate (text-only)`);
      const { questions, totalGenerated } = await generateAndValidate(analysis, difficulty, numQuestions, questionTypes, language);
      console.log(`[Pipeline] Step 2 OK. ${questions.length}/${totalGenerated} questions.`);

      if (!questions.length) throw new Error('No valid questions generated');

      return NextResponse.json({
        questions,
        pipeline: {
          stages: ['analyze_content', 'generate_question', 'validate_question'],
          models: usedModels,
          contentAnalysis: {
            topics: analysis.topics,
            keyConcepts: analysis.keyConcepts,
            learningObjectives: analysis.learningObjectives,
          },
          validation: { totalGenerated, passedValidation: questions.length, removedCount: totalGenerated - questions.length },
        },
      });
    } catch (aiError) {
      const err = aiError as Error;
      console.error(`[Pipeline] v3 FAIL at ${pipelineStage}: ${err.message}`);
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
