const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Header, Footer,
  AlignmentType, HeadingLevel, PageNumber, PageBreak,
  Table, TableRow, TableCell, WidthType, ShadingType,
  BorderStyle, TableLayoutType, ImageRun, Tab, TabStopPosition, TabStopType,
  NumberFormat,
} = require("docx");

// ─── Palette: DM-1 Deep Cyan (AI / Tech) ───
const P = {
  bg: "162235", primary: "FFFFFF", accent: "37DCF2",
  body: "1A2B40", secondary: "506070",
  surface: "F4F8FC", tableBg: "1B6B7A",
};
const cp = "162235"; // cover bg
const c = (hex) => hex.replace("#", "");

// Border helpers
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

// ─── calcTitleLayout ───
function calcTitleLayout(title, maxWidthTwips, preferredPt = 40, minPt = 24) {
  const charWidth = (pt) => pt * 20;
  const charsPerLine = (pt) => Math.floor(maxWidthTwips / charWidth(pt));
  let titlePt = preferredPt;
  let lines;
  while (titlePt >= minPt) {
    const cpl = charsPerLine(titlePt);
    if (cpl < 2) { titlePt -= 2; continue; }
    lines = splitTitleLines(title, cpl);
    if (lines.length <= 3) break;
    titlePt -= 2;
  }
  if (!lines || lines.length > 3) {
    const cpl = charsPerLine(minPt);
    lines = splitTitleLines(title, cpl);
    titlePt = minPt;
  }
  return { titlePt, titleLines: lines };
}

function splitTitleLines(title, charsPerLine) {
  if (title.length <= charsPerLine) return [title];
  const breakAfter = new Set([
    ...' ,-;:!?./',
    ...' \t',
  ]);
  const lines = [];
  let remaining = title;
  while (remaining.length > charsPerLine) {
    let breakAt = -1;
    for (let i = charsPerLine; i >= Math.floor(charsPerLine * 0.6); i--) {
      if (i < remaining.length && breakAfter.has(remaining[i - 1])) {
        breakAt = i; break;
      }
    }
    if (breakAt === -1) {
      const limit = Math.min(remaining.length, Math.ceil(charsPerLine * 1.3));
      for (let i = charsPerLine + 1; i < limit; i++) {
        if (breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
      }
    }
    if (breakAt === -1) breakAt = charsPerLine;
    lines.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }
  if (remaining) lines.push(remaining);
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) {
    const last = lines.pop();
    lines[lines.length - 1] += last;
  }
  return lines;
}

// ─── calcCoverSpacing ───
function calcCoverSpacing(params) {
  const {
    titleLineCount = 1, titlePt = 36, hasSubtitle = false,
    hasEnglishLabel = false, metaLineCount = 0,
    fixedHeight = 800, pageHeight = 16838, marginTop = 0, marginBottom = 0,
  } = params;
  const SAFETY = 1200;
  const usableHeight = pageHeight - marginTop - marginBottom - SAFETY;
  const titleHeight = titleLineCount * (titlePt * 23 + 200);
  const subtitleHeight = hasSubtitle ? (12 * 23 + 600) : 0;
  const englishLabelHeight = hasEnglishLabel ? (9 * 23 + 600) : 0;
  const metaHeight = metaLineCount * (10 * 23 + 100);
  const implicitParaHeight = 3 * 300;
  const contentHeight = titleHeight + subtitleHeight + englishLabelHeight + metaHeight + fixedHeight + implicitParaHeight;
  const remainingSpace = usableHeight - contentHeight;
  const safeRemaining = Math.max(remainingSpace, 400);
  const FOOTER_MIN = 800;
  const rawTop = Math.floor(safeRemaining * 0.45);
  const rawBottom = Math.floor(safeRemaining * 0.45);
  const bottomSpacing = Math.max(rawBottom, FOOTER_MIN);
  const topSpacing = Math.max(rawTop - Math.max(0, FOOTER_MIN - rawBottom), 400);
  return { topSpacing, midSpacing: Math.max(safeRemaining - topSpacing - bottomSpacing, 0), bottomSpacing };
}

// ─── Build Cover R1 ───
function buildCoverR1(config) {
  const padL = 1200, padR = 800;
  const availableWidth = 11906 - padL - padR - 300;
  const { titlePt, titleLines } = calcTitleLayout(config.title, availableWidth, 40, 24);
  const titleSize = titlePt * 2;
  const spacing = calcCoverSpacing({
    titleLineCount: titleLines.length, titlePt,
    hasSubtitle: !!config.subtitle, hasEnglishLabel: !!config.englishLabel,
    metaLineCount: (config.metaLines || []).length, fixedHeight: 400,
  });
  const accentLeft = { style: BorderStyle.SINGLE, size: 8, color: c(P.accent), space: 12 };
  const children = [];

  // 1. Top whitespace
  children.push(new Paragraph({ spacing: { before: spacing.topSpacing } }));

  // 2. English label
  if (config.englishLabel) {
    children.push(new Paragraph({
      indent: { left: padL, right: padR }, spacing: { after: 500 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: c(P.accent), space: 8 } },
      children: [new TextRun({ text: config.englishLabel.split("").join("  "),
        size: 18, color: c(P.accent), font: { ascii: "Calibri" }, characterSpacing: 40 })],
    }));
  }

  // 3. Title
  for (let i = 0; i < titleLines.length; i++) {
    children.push(new Paragraph({
      indent: { left: padL },
      spacing: { after: i < titleLines.length - 1 ? 100 : 300, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
      children: [new TextRun({ text: titleLines[i], size: titleSize, bold: true,
        color: c(P.primary), font: { ascii: "Arial" } })],
    }));
  }

  // 4. Subtitle
  if (config.subtitle) {
    children.push(new Paragraph({
      indent: { left: padL }, spacing: { after: 800 },
      children: [new TextRun({ text: config.subtitle, size: 24, color: "B0B8C0",
        font: { ascii: "Arial" } })],
    }));
  }

  // 5. Meta lines
  for (const line of (config.metaLines || [])) {
    children.push(new Paragraph({
      indent: { left: padL + 200 }, spacing: { after: 80 },
      border: { left: accentLeft },
      children: [new TextRun({ text: line, size: 24, color: "90989F",
        font: { ascii: "Arial" } })],
    }));
  }

  // 6. Bottom whitespace
  children.push(new Paragraph({ spacing: { before: spacing.bottomSpacing } }));

  // 7. Footer
  children.push(new Paragraph({
    indent: { left: padL, right: padR },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: c(P.accent), space: 8 } },
    spacing: { before: 200 },
    children: [
      new TextRun({ text: config.footerLeft || "", size: 16, color: "687078", font: { ascii: "Arial" } }),
      new TextRun({ text: "                                                    " }),
      new TextRun({ text: config.footerRight || "", size: 16, color: "687078", font: { ascii: "Arial" } }),
    ],
  }));

  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: cp }, borders: noBorders,
        children,
      })],
    })],
  })];
}

// ─── Body helpers ───
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, color: c(P.body), font: { ascii: "Arial" } })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, bold: true, size: 28, color: c(P.body), font: { ascii: "Arial" } })],
  });
}
function para(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: 160 },
    children: [new TextRun({ text, size: 24, color: c(P.body), font: { ascii: "Calibri" } })],
  });
}
function boldPara(label, text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: 160 },
    children: [
      new TextRun({ text: label, bold: true, size: 24, color: c(P.body), font: { ascii: "Calibri" } }),
      new TextRun({ text, size: 24, color: c(P.body), font: { ascii: "Calibri" } }),
    ],
  });
}
function bullet(text) {
  return new Paragraph({
    spacing: { line: 312, after: 80 },
    indent: { left: 480 },
    children: [
      new TextRun({ text: "  ", size: 24 }),
      new TextRun({ text, size: 24, color: c(P.body), font: { ascii: "Calibri" } }),
    ],
  });
}

// ─── Build document ───
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Calibri" }, size: 24, color: c(P.body) },
        paragraph: { spacing: { line: 312 } },
      },
    },
  },
  sections: [
    // ── Section 1: Cover ──
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838, orientation: "portrait" },
          margin: { top: 0, bottom: 0, left: 0, right: 0 },
        },
      },
      children: buildCoverR1({
        title: "ScanLearn",
        subtitle: "Transform Any Textbook Into an Adaptive Quiz",
        englishLabel: "GEMMA 4 GOOD HACKATHON",
        metaLines: [
          "Track: Future of Education",
          "Powered by Gemma 4 Multimodal + Function Calling",
          "Gemma 4 Good Hackathon 2026",
        ],
        footerLeft: "Kaggle Writeup",
        footerRight: "May 2026",
        palette: { bg: cp, primary: P.primary, accent: P.accent },
      }),
    },
    // ── Section 2: Body ──
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1 },
        },
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.secondary), font: { ascii: "Calibri" } })],
          })],
        }),
      },
      children: [
        // ─── The Problem ───
        h1("The Problem"),

        para("In classrooms across the developing world, a single textbook might serve fifty students. Teachers spend hours each week crafting quizzes by hand, transcribing questions from worn pages onto chalkboards, and hoping the material meets every student at their level. For the students themselves, learning is a one-size-fits-all experience: the same questions, the same difficulty, the same pace, regardless of whether a child is racing ahead or silently falling behind."),

        para("This problem is not limited to low-resource environments. Even in well-equipped schools, the demand for personalized learning far outstrips what educators can deliver manually. Research from UNESCO estimates that 244 million children worldwide lack access to quality education, and a significant contributor to this gap is the inability to provide adaptive, individualized learning materials at scale. Existing digital quiz tools require pre-digitized content, extensive teacher training, and reliable internet, making them impractical for the communities that need them most."),

        // ─── Our Solution ───
        h1("Our Solution: ScanLearn"),

        para("ScanLearn is an AI-powered application that transforms any physical textbook page into an interactive, adaptive quiz in seconds. A teacher or student simply photographs a page from any textbook, and Gemma 4's multimodal capabilities read and understand the content. The system then generates a structured set of quiz questions tailored to the learner's chosen difficulty level, language preference, and question type, all without requiring pre-digitized content or internet connectivity."),

        para("The core workflow is deliberately simple: Upload a textbook image, configure quiz parameters, and begin learning. Behind the scenes, ScanLearn leverages Gemma 4's multimodal understanding to parse complex layouts including diagrams, equations, and multi-column text. It then uses Gemma 4's native function calling to orchestrate a quiz generation pipeline that produces multiple-choice, true/false, fill-in-the-blank, and short-answer questions. An adaptive engine tracks student performance and adjusts question difficulty in real time, creating a personalized learning trajectory for each individual."),

        // ─── How We Use Gemma 4 ───
        h1("How We Use Gemma 4"),

        h2("Multimodal Understanding"),
        para("Gemma 4's multimodal capabilities are central to ScanLearn. Rather than requiring teachers to type or scan text through OCR pipelines, ScanLearn accepts raw photographs of textbook pages. Gemma 4 processes these images holistically, understanding not just the text but also the spatial relationships between content blocks, diagrams, tables, and mathematical expressions. This means a student can photograph a page containing a biology diagram with labeled parts, and the generated quiz will include questions about the diagram itself, not just the surrounding text."),

        h2("Native Function Calling"),
        para("ScanLearn uses Gemma 4's function calling feature to structure the quiz generation process as a pipeline of specialized tools. When a user uploads an image, the system invokes a content analysis function to extract key concepts and learning objectives. It then calls a question generation function with parameters for difficulty, question type, and language. Finally, a validation function verifies that each question is answerable from the source material and free of ambiguity. This structured approach ensures consistent, high-quality quiz output while keeping the AI's reasoning transparent and auditable."),

        h2("Local Deployment for Offline Use"),
        para("Designed with digital equity in mind, ScanLearn supports full local deployment using quantized Gemma 4 models. Schools without reliable internet can run the entire application on a single laptop or edge device, processing textbook images and generating quizzes entirely offline. This architecture ensures that student data never leaves the device, addressing critical privacy concerns in educational settings while making the tool accessible to underserved communities."),

        // ─── Architecture ───
        h1("Technical Architecture"),

        para("ScanLearn is built as a modern web application using Next.js with TypeScript and Tailwind CSS. The frontend provides a responsive, mobile-friendly interface with drag-and-drop image upload, real-time quiz interaction, and animated progress tracking. The backend exposes a REST API that manages sessions, tracks student progress, and orchestrates the AI processing pipeline."),

        para("The AI layer runs as a modular pipeline: the uploaded image is first processed by Gemma 4 Multimodal for content understanding, then routed through function-calling-based quiz generators, and finally passed through the adaptive engine that calibrates difficulty based on the student's answer history. All quiz data and progress records are stored in PostgreSQL, with Redis caching frequently accessed content to ensure fast response times even on resource-constrained hardware."),

        // ─── Challenges ───
        h1("Challenges and Technical Decisions"),

        para("The primary challenge was ensuring that quiz questions are genuinely grounded in the source material and not hallucinated. We addressed this through a RAG-inspired architecture where the multimodal analysis extracts explicit content segments, and each generated question is validated against these segments before being presented to the student. Another challenge was supporting multilingual quiz generation without sacrificing quality. By leveraging Gemma 4's strong multilingual capabilities and providing explicit language context in the function calling prompts, we achieved reliable output across English, Spanish, Hindi, and French."),

        para("Performance on edge devices was also a key consideration. We implemented a lightweight fallback mode that uses pre-computed quiz templates when the full model is unavailable, ensuring the application remains functional even on minimal hardware. This graceful degradation strategy means ScanLearn works everywhere, from a school computer lab to a teacher's personal laptop."),

        // ─── Impact ───
        h1("Real-World Impact"),

        para("ScanLearn directly addresses the Future of Education track's core mission: reimagining learning through AI that adapts to the individual. By eliminating the need for pre-digitized content, it democratizes access to personalized learning for schools that cannot afford expensive digital curricula. By supporting local deployment, it reaches communities where internet connectivity remains unreliable. And by generating quizzes in multiple languages, it serves linguistically diverse classrooms where a single textbook might be the only shared learning resource."),

        para("Our vision extends beyond the classroom. ScanLearn can empower self-directed learners, support homeschooling parents, and provide professional development tools for educators who want to quickly assess student comprehension of any reading material. With Gemma 4 as its foundation, ScanLearn transforms the humble textbook from a static artifact into an interactive, adaptive learning experience, bridging the gap between traditional education and the AI-powered future."),
      ],
    },
  ],
});

// ─── Write file ───
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/home/z/my-project/download/scanlearn/docs/Kaggle_Writeup_ScanLearn.docx", buf);
  console.log("Kaggle Writeup generated successfully!");
});
