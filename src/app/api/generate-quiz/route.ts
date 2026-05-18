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
 * Robust JSON extraction from LLM output.
 * LLMs often wrap JSON in markdown code blocks or add surrounding text.
 */
function extractJSON(rawContent: string, stageName: string): unknown {
  if (!rawContent || rawContent.trim().length === 0) {
    throw new Error(`Empty response from ${stageName}`);
  }

  const trimmed = rawContent.trim();
  console.log(`[${stageName}] Raw response (${trimmed.length} chars):`, trimmed.substring(0, 500));

  // ── Strategy 1: Direct parse (if model returned clean JSON) ──
  try {
    const parsed = JSON.parse(trimmed);
    console.log(`[${stageName}] Direct JSON.parse succeeded`);
    return parsed;
  } catch {
    // continue
  }

  // ── Strategy 2: Extract from ```json ... ``` or ``` ... ``` code block ──
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/;
  const codeMatch = trimmed.match(codeBlockRegex);
  if (codeMatch) {
    const inner = codeMatch[1].trim();
    try {
      const parsed = JSON.parse(inner);
      console.log(`[${stageName}] Extracted from code block, parsed OK`);
      return parsed;
    } catch {
      console.log(`[${stageName}] Code block content failed parse: ${inner.substring(0, 200)}`);
    }
  }

  // ── Strategy 3: Balanced bracket/brace extraction ──
  // Find the first { or [ and match to its closing counterpart
  const startBrace = trimmed.indexOf('{');
  const startBracket = trimmed.indexOf('[');

  let startIdx = -1;
  let openChar = '';
  let closeChar = '';

  if (startBrace !== -1 && (startBracket === -1 || startBrace < startBracket)) {
    startIdx = startBrace;
    openChar = '{';
    closeChar = '}';
  } else if (startBracket !== -1) {
    startIdx = startBracket;
    openChar = '[';
    closeChar = ']';
  }

  if (startIdx === -1) {
    throw new Error(`No JSON structure found in ${stageName}. Raw: ${trimmed.substring(0, 300)}`);
  }

  // Walk through string with string-aware balanced matching
  let depth = 0;
  let inString = false;
  let escaped = false;
  let endIdx = -1;

  for (let i = startIdx; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === openChar) depth++;
    if (ch === closeChar) depth--;
    if (depth === 0) { endIdx = i + 1; break; }
  }

  if (endIdx === -1) {
    throw new Error(`Unbalanced JSON in ${stageName}. Raw: ${trimmed.substring(startIdx, startIdx + 300)}`);
  }

  let extracted = trimmed.substring(startIdx, endIdx);

  // Clean trailing commas before } or ]
  extracted = extracted.replace(/,\s*([\]}])/g, '$1');

  // Remove control characters (keep \n \t \r)
  extracted = extracted.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

  try {
    const parsed = JSON.parse(extracted);
    console.log(`[${stageName}] Balanced extraction + clean succeeded`);
    return parsed;
  } catch (parseErr) {
    console.error(`[${stageName}] All parse strategies failed. Last attempt raw: ${extracted.substring(0, 300)}`);
    throw new Error(
      `Could not parse JSON from ${stageName}. ` +
      `Extracted (first 200 chars): ${extracted.substring(0, 200)}`
    );
  }
}

/**
 * Call Gemma 4 multimodal model — image BEFORE text.
 * No responseMimeType (Gemma 4 does not support JSON mode).
 * Relies on prompt engineering + robust parser instead.
 */
async function callGemma4(prompt: string, image: string, stageName: string, retries = 1): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemma-4-26b-a4b-it' });
  const { mimeType, data } = extractBase64(image);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`[${stageName}] API call attempt ${attempt + 1}/${retries + 1}...`);

      const result = await model.generateContent([
        { inlineData: { mimeType, data } },
        { text: prompt },
      ]);

      const text = result.response.text();
      if (!text || text.trim().length === 0) {
        throw new Error(`Empty response from model at ${stageName}`);
      }

      console.log(`[${stageName}] Got response: ${text.length} chars`);
      return text;
    } catch (error: unknown) {
      const err = error as Error & { status?: number };
      const status = err.status || 0;
      console.error(`[${stageName}] Attempt ${attempt + 1} failed: HTTP ${status || 'N/A'} — ${err.message?.substring(0, 200)}`);

      if (attempt < retries && (status === 500 || status === 503 || status === 429)) {
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }
      throw error;
    }
  }
  throw new Error(`Max retries exceeded for ${stageName}`);
}

/**
 * STEP 1: analyze_content()
 * Uses Gemma 4 multimodal vision to extract key concepts from textbook image.
 */
async function analyzeContent(image: string, language: string) {
  const prompt = `You are an expert educational content analyzer. Analyze this textbook page image and return a JSON object.

IMPORTANT: Your entire response must be ONLY a valid JSON object. No explanations, no markdown, no text before or after the JSON.

Example format:
{
  "topics": ["Topic 1", "Topic 2"],
  "keyConcepts": ["concept1", "concept2"],
  "learningObjectives": ["objective1", "objective2"],
  "contentSummary": "Brief summary here",
  "difficultyIndicators": {
    "estimatedLevel": "beginner",
    "reasoning": "reason here"
  },
  "contentSegments": [
    {"segment": "text segment", "potentialQuestionType": "mcq"}
  ]
}

Fields to extract:
1. "topics": array of main topics covered
2. "keyConcepts": array of key concepts and terminology
3. "learningObjectives": array of what a student should learn
4. "contentSummary": brief summary of the page content
5. "difficultyIndicators": object with "estimatedLevel" (beginner/intermediate/advanced) and "reasoning"
6. "contentSegments": array of segments with "segment" text and "potentialQuestionType" (mcq/true_false/fill_blank/short_answer)

Analyze ALL content: text, diagrams, tables, math.
Topics and concepts in ${language}, JSON keys in English.
Return ONLY the JSON object, nothing else.`;

  const content = await callGemma4(prompt, image, 'analyze_content');
  return extractJSON(content, 'analyze_content') as Record<string, unknown>;
}

/**
 * STEP 2: generate_question()
 * Uses content analysis to generate structured quiz questions.
 */
async function generateQuestions(
  image: string,
  contentAnalysis: Record<string, unknown>,
  difficulty: string,
  numQuestions: number,
  questionTypes: string[],
  language: string
) {
  const difficultyDescriptions: Record<string, string> = {
    beginner: 'Basic recall and understanding. Simple vocabulary.',
    intermediate: 'Application and analysis. Connect concepts.',
    advanced: 'Critical thinking and evaluation. Deep reasoning.',
  };

  const typeDescriptions = questionTypes
    .map((t) => {
      const map: Record<string, string> = {
        mcq: 'MCQ (4 options)',
        true_false: 'True/False',
        fill_blank: 'Fill in the Blank',
        short_answer: 'Short Answer (1-2 sentences)',
      };
      return map[t] || t;
    })
    .join(', ');

  const prompt = `You are an expert quiz creator. I have analyzed a textbook page:

${JSON.stringify(contentAnalysis, null, 2)}

Generate exactly ${numQuestions} quiz questions.

IMPORTANT: Return ONLY a valid JSON array. No explanations, no markdown, no text before/after.

Example:
[
  {
    "type": "mcq",
    "id": 1,
    "question": "What is X?",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0,
    "explanation": "Because...",
    "difficultyRating": "easy",
    "topicTag": "topic name"
  }
]

Requirements:
- Question types: ${typeDescriptions}
- Difficulty: ${difficulty} — ${difficultyDescriptions[difficulty] || difficultyDescriptions.intermediate}
- Language: ${language}
- Each question needs: explanation, difficultyRating (easy/medium/hard), topicTag
- Mix difficulty: ~30% easy, 40% medium, 30% hard
- correctAnswer for MCQ = 0-based index of correct option
- IDs start from 1

Question type formats:
- MCQ: {"type":"mcq","id":N,"question":"...","options":["A","B","C","D"],"correctAnswer":INDEX,"explanation":"...","difficultyRating":"easy|medium|hard","topicTag":"..."}
- True/False: {"type":"true_false","id":N,"question":"...","correctAnswer":true/false,"explanation":"...","difficultyRating":"...","topicTag":"..."}
- Fill Blank: {"type":"fill_blank","id":N,"question":"...with _____ blank","correctAnswer":"answer","explanation":"...","difficultyRating":"...","topicTag":"..."}
- Short Answer: {"type":"short_answer","id":N,"question":"...","correctAnswer":"expected answer","explanation":"...","difficultyRating":"...","topicTag":"..."}

Return ONLY the JSON array.`;

  const content = await callGemma4(prompt, image, 'generate_question');
  const parsed = extractJSON(content, 'generate_question');

  // Normalize: model might wrap in object
  if (Array.isArray(parsed)) return parsed as QuizQuestion[];
  if (parsed && typeof parsed === 'object' && 'questions' in parsed) {
    return (parsed as { questions: QuizQuestion[] }).questions;
  }
  if (parsed && typeof parsed === 'object' && 'results' in parsed) {
    return (parsed as { results: QuizQuestion[] }).results;
  }
  throw new Error('generate_question did not return a questions array');
}

/**
 * STEP 3: validate_question()
 * Validates questions against source content.
 */
async function validateQuestions(
  image: string,
  questions: QuizQuestion[],
  contentAnalysis: Record<string, unknown>
) {
  const prompt = `You are a quiz quality validator. Here is a textbook page analysis and quiz questions.

Content analysis:
${JSON.stringify(contentAnalysis, null, 2)}

Questions:
${JSON.stringify(questions, null, 2)}

Validate each question. IMPORTANT: Return ONLY a valid JSON array. No explanations.

Example:
[
  {"id": 1, "isValid": true, "issues": [], "suggestedFix": ""},
  {"id": 2, "isValid": false, "issues": ["Not answerable from page"], "suggestedFix": "Rewrite based on..."}
]

For each question:
- "id": question ID
- "isValid": true if answerable from page content
- "issues": array of problem descriptions (empty if valid)
- "suggestedFix": fix suggestion (empty if valid)

Be strict but fair. Return ONLY the JSON array.`;

  const content = await callGemma4(prompt, image, 'validate_question');
  const parsed = extractJSON(content, 'validate_question');

  if (Array.isArray(parsed)) {
    return parsed as { id: number; isValid: boolean; issues: string[]; suggestedFix: string }[];
  }
  throw new Error('validate_question did not return an array');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      image,
      difficulty = 'intermediate',
      numQuestions = 5,
      questionTypes = ['mcq'],
      language = 'English',
    } = body;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      console.warn('[Pipeline] GOOGLE_AI_API_KEY not set, using sample fallback');
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
      // STEP 1: analyze_content()
      // ============================================================
      pipelineStage = 'analyze_content';
      console.log('[Pipeline] Step 1/3: analyze_content() — Analyzing textbook image...');
      contentAnalysis = await analyzeContent(image, language);
      console.log(
        '[Pipeline] Step 1 complete. Topics:',
        (contentAnalysis.topics as string[])?.join(', ') || 'none detected'
      );

      // ============================================================
      // STEP 2: generate_question()
      // ============================================================
      pipelineStage = 'generate_question';
      console.log('[Pipeline] Step 2/3: generate_question() — Creating quiz questions...');
      let questions: QuizQuestion[] = await generateQuestions(
        image, contentAnalysis, difficulty, numQuestions, questionTypes, language
      );
      console.log(`[Pipeline] Step 2 complete. Generated ${questions.length} questions.`);

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('No valid questions generated');
      }

      // ============================================================
      // STEP 3: validate_question()
      // ============================================================
      pipelineStage = 'validate_question';
      console.log('[Pipeline] Step 3/3: validate_question() — Validating questions...');
      const validationResults = await validateQuestions(image, questions, contentAnalysis);

      const validQuestions = questions.filter((q) => {
        const v = validationResults.find((r) => r.id === q.id);
        return v?.isValid !== false;
      });

      const removedCount = questions.length - validQuestions.length;
      console.log(
        `[Pipeline] Step 3 complete. ${validQuestions.length}/${questions.length} passed validation.`
      );

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
      const err = aiError as Error;
      console.error(`[Pipeline] AI error at '${pipelineStage}': ${err.message}`);
      const shuffled = [...sampleQuestions].sort(() => Math.random() - 0.5);
      return NextResponse.json({
        questions: shuffled.slice(0, numQuestions),
        pipeline: {
          stages: ['analyze_content', 'generate_question', 'validate_question'],
          error: `Pipeline failed at: ${pipelineStage} — ${err.message?.substring(0, 120)}`,
          usedFallback: true,
        },
      });
    }
  } catch (error) {
    console.error('[Pipeline] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Failed to generate quiz. Please try again.' },
      { status: 500 }
    );
  }
}
