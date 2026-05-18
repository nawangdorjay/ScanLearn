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
 * Robust JSON parser that handles AI model output quirks.
 * Tries multiple strategies to extract valid JSON.
 */
function parseJSONResponse(rawContent: string, stageName: string): unknown {
  if (!rawContent || rawContent.trim().length === 0) {
    throw new Error(`Empty response from ${stageName}`);
  }

  let jsonStr = rawContent.trim();

  // Log raw response for debugging (first 300 chars)
  console.log(`[${stageName}] Raw response (${jsonStr.length} chars):`, jsonStr.substring(0, 300));

  // Strategy 1: Try direct JSON.parse (works when responseMimeType is set)
  try {
    return JSON.parse(jsonStr);
  } catch {
    // Continue to next strategy
  }

  // Strategy 2: Remove markdown code blocks (```json ... ```)
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // Continue
    }
  }

  // Strategy 3: Extract first complete JSON object using balanced brace matching
  const firstBrace = jsonStr.indexOf('{');
  const firstBracket = jsonStr.indexOf('[');

  if (firstBrace === -1 && firstBracket === -1) {
    throw new Error(`No JSON found in ${stageName} response. Raw: ${jsonStr.substring(0, 200)}`);
  }

  // Determine which starts first
  const startIdx = firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)
    ? firstBrace
    : firstBracket;
  const openChar = jsonStr[startIdx];
  const closeChar = openChar === '{' ? '}' : ']';

  // Balanced matching to find the complete JSON structure
  let depth = 0;
  let inString = false;
  let escaped = false;
  let endIdx = -1;

  for (let i = startIdx; i < jsonStr.length; i++) {
    const ch = jsonStr[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === openChar) depth++;
    if (ch === closeChar) depth--;
    if (depth === 0) {
      endIdx = i + 1;
      break;
    }
  }

  if (endIdx === -1) {
    throw new Error(`Incomplete JSON in ${stageName} response. Raw: ${jsonStr.substring(0, 200)}`);
  }

  const extracted = jsonStr.substring(startIdx, endIdx);

  // Clean common issues: trailing commas before } or ]
  const cleaned = extracted.replace(/,\s*([\]}])/g, '$1');

  try {
    return JSON.parse(cleaned);
  } catch (parseError) {
    // Last resort: try fixing common issues
    try {
      // Remove control characters except newline and tab
      const sanitized = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
      return JSON.parse(sanitized);
    } catch {
      throw new Error(
        `Failed to parse JSON from ${stageName}. Extracted: ${extracted.substring(0, 300)}`
      );
    }
  }
}

/**
 * Create a Gemma 4 model instance with JSON-forced output.
 * Uses responseMimeType to ensure the model returns valid JSON.
 */
function createGemmaModel() {
  return genAI.getGenerativeModel({
    model: 'gemma-4-26b-a4b-it',
    systemInstruction:
      'You are an expert educational AI assistant. You MUST respond with valid JSON only. Do NOT include any markdown formatting, code blocks, backticks, explanations, or text outside the JSON structure.',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  });
}

/**
 * Call Gemma 4 multimodal model with text + image.
 * Image MUST come before text for multimodal models.
 * Uses responseMimeType to force valid JSON output.
 */
async function callGemma4(prompt: string, image: string, stageName: string, retries = 2): Promise<string> {
  const model = createGemmaModel();
  const { mimeType, data } = extractBase64(image);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`[${stageName}] API call attempt ${attempt + 1}/${retries + 1}...`);

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType, data } },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      });

      const response = result.response;
      const text = response.text();

      if (!text || text.trim().length === 0) {
        throw new Error(`Empty response from Gemma 4 at ${stageName}`);
      }

      console.log(`[${stageName}] Success! Response length: ${text.length} chars`);
      return text;
    } catch (error: unknown) {
      const err = error as Error & { status?: number; message?: string };
      const statusCode = err.status || 0;
      const isRetryable = statusCode === 500 || statusCode === 503 || statusCode === 429;

      console.error(
        `[${stageName}] Attempt ${attempt + 1} failed:`,
        statusCode ? `HTTP ${statusCode}` : '',
        err.message?.substring(0, 200)
      );

      if (attempt < retries && isRetryable) {
        const delay = Math.pow(2, attempt) * 2000;
        console.warn(`[${stageName}] Retry in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      // If responseMimeType causes issues, try without it as fallback
      if (attempt === retries && err.message?.includes('responseMimeType')) {
        console.warn(`[${stageName}] responseMimeType not supported, retrying without it...`);
        try {
          const fallbackResult = await model.generateContent([
            { inlineData: { mimeType, data } },
            { text: prompt },
          ]);
          const fallbackText = fallbackResult.response.text();
          if (fallbackText) {
            console.log(`[${stageName}] Fallback (no responseMimeType) succeeded: ${fallbackText.length} chars`);
            return fallbackText;
          }
        } catch (fallbackErr) {
          console.error(`[${stageName}] Fallback also failed:`, fallbackErr);
        }
      }

      throw error;
    }
  }

  throw new Error(`Max retries exceeded for ${stageName}`);
}

/**
 * STEP 1: analyze_content()
 * Uses Gemma 4 multimodal vision to extract key concepts, topics,
 * and learning objectives from the textbook page image.
 */
async function analyzeContent(image: string, language: string) {
  const prompt = `Analyze this textbook page image thoroughly. Extract and return a JSON object with these fields:

1. "topics": array of main topics covered (strings)
2. "keyConcepts": array of key concepts and terminology (strings)
3. "learningObjectives": array of what a student should learn from this page (strings)
4. "contentSummary": a brief summary of the page content (string)
5. "difficultyIndicators": object with "estimatedLevel" ("beginner", "intermediate", or "advanced") and "reasoning" (string)
6. "contentSegments": array of specific content segments that could be used for quiz questions, each with "segment" (string) and "potentialQuestionType" (one of: "mcq", "true_false", "fill_blank", "short_answer")

Analyze ALL content including text, diagrams, tables, and mathematical expressions.
Respond in ${language} for topics and concepts, but keep JSON keys in English.`;

  const content = await callGemma4(prompt, image, 'analyze_content');
  return parseJSONResponse(content, 'analyze_content') as Record<string, unknown>;
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

  const prompt = `I have already analyzed this textbook page content.

CONTENT ANALYSIS:
${JSON.stringify(contentAnalysis, null, 2)}

Now generate exactly ${numQuestions} quiz questions based on this analysis.

Requirements:
- Use these question types: ${typeDescriptions}
- Base difficulty: ${difficulty} — ${difficultyGuide[difficulty] || difficultyGuide.intermediate}
- Generate questions in ${language}
- For each question, provide a clear explanation
- Include a "difficultyRating" field for each question with one of: "easy", "medium", "hard"
  - Mix difficulty levels: roughly 30% easy, 40% medium, 30% hard
- Include a "topicTag" field for each question identifying which topic from the analysis it relates to

Return a JSON array with this structure:
- For MCQ: {"type":"mcq","id":NUMBER,"question":"...","options":["A","B","C","D"],"correctAnswer":INDEX,"explanation":"...","difficultyRating":"easy|medium|hard","topicTag":"..."}
- For True/False: {"type":"true_false","id":NUMBER,"question":"...","correctAnswer":true/false,"explanation":"...","difficultyRating":"easy|medium|hard","topicTag":"..."}
- For Fill-in-blank: {"type":"fill_blank","id":NUMBER,"question":"...with _____ blank","correctAnswer":"the answer","explanation":"...","difficultyRating":"easy|medium|hard","topicTag":"..."}
- For Short Answer: {"type":"short_answer","id":NUMBER,"question":"...","correctAnswer":"expected answer","explanation":"...","difficultyRating":"easy|medium|hard","topicTag":"..."}

The correctAnswer for MCQ must be the 0-based index of the correct option.
Start IDs from 1 and increment.`;

  const content = await callGemma4(prompt, image, 'generate_question');
  const parsed = parseJSONResponse(content, 'generate_question');

  // Ensure we always return an array
  if (Array.isArray(parsed)) return parsed as QuizQuestion[];
  if (parsed && typeof parsed === 'object' && 'questions' in parsed) {
    return (parsed as { questions: QuizQuestion[] }).questions;
  }
  throw new Error('generate_question did not return an array of questions');
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
  const prompt = `I will show you a textbook page image, its content analysis, and generated quiz questions.

CONTENT ANALYSIS:
${JSON.stringify(contentAnalysis, null, 2)}

GENERATED QUESTIONS:
${JSON.stringify(questions, null, 2)}

Validate each question. Return a JSON array of objects with:
- "id": the question ID
- "isValid": boolean (true if the question is answerable from the page content and not ambiguous)
- "issues": array of strings describing any problems (empty if valid)
- "suggestedFix": string with a fix suggestion if issues exist (empty string if valid)

Be strict but fair. A question is valid if a student who read the page could reasonably answer it.`;

  const content = await callGemma4(prompt, image, 'validate_question');
  const parsed = parseJSONResponse(content, 'validate_question');

  if (Array.isArray(parsed)) {
    return parsed as { id: number; isValid: boolean; issues: string[]; suggestedFix: string }[];
  }
  throw new Error('validate_question did not return an array of validation results');
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

    // Check if API key is configured
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
      // STEP 1: analyze_content() — Extract key concepts from image
      // ============================================================
      pipelineStage = 'analyze_content';
      console.log('[Pipeline] Step 1: analyze_content() — Extracting key concepts from image...');
      contentAnalysis = await analyzeContent(image, language);
      console.log(
        '[Pipeline] Step 1 complete. Topics:',
        (contentAnalysis.topics as string[])?.join(', ') || 'none detected'
      );

      // ============================================================
      // STEP 2: generate_question() — Generate quiz questions
      // ============================================================
      pipelineStage = 'generate_question';
      console.log('[Pipeline] Step 2: generate_question() — Creating quiz questions...');
      let questions: QuizQuestion[] = await generateQuestions(
        image,
        contentAnalysis,
        difficulty,
        numQuestions,
        questionTypes,
        language
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
      console.log(
        `[Pipeline] Step 3 complete. ${validQuestions.length}/${questions.length} questions passed validation.`
      );

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
      const err = aiError as Error;
      console.error(`[Pipeline] AI pipeline error at stage '${pipelineStage}':`, err.message);
      // Fall back to sample questions gracefully
      const shuffled = [...sampleQuestions].sort(() => Math.random() - 0.5);
      const sliced = shuffled.slice(0, numQuestions);
      return NextResponse.json({
        questions: sliced,
        pipeline: {
          stages: ['analyze_content', 'generate_question', 'validate_question'],
          error: `Pipeline failed at: ${pipelineStage} — ${err.message?.substring(0, 100)}`,
          usedFallback: true,
        },
      });
    }
  } catch (error) {
    console.error('[Pipeline] Generate quiz error:', error);
    return NextResponse.json(
      { error: 'Failed to generate quiz. Please try again.' },
      { status: 500 }
    );
  }
}
