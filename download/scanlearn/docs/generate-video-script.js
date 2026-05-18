const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Header, Footer,
  AlignmentType, HeadingLevel, PageNumber, PageBreak,
  Table, TableRow, TableCell, WidthType, ShadingType,
  BorderStyle, TableLayoutType,
} = require("docx");

// ─── Palette: GO-1 Graphite Orange (proposal/creative) ───
const P = {
  bg: "1A2330", primary: "FFFFFF", accent: "D4875A",
  body: "2C3E50", secondary: "607080", surface: "FDF8F3",
};
const cp = "1A2330";
const c = (hex) => hex.replace("#", "");

const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

function calcTitleLayout(title, maxWidthTwips, preferredPt = 40, minPt = 24) {
  const charWidth = (pt) => pt * 20;
  const charsPerLine = (pt) => Math.floor(maxWidthTwips / charWidth(pt));
  let titlePt = preferredPt, lines;
  while (titlePt >= minPt) {
    const cpl = charsPerLine(titlePt);
    if (cpl < 2) { titlePt -= 2; continue; }
    lines = splitTitleLines(title, cpl);
    if (lines.length <= 3) break;
    titlePt -= 2;
  }
  if (!lines || lines.length > 3) { lines = splitTitleLines(title, charsPerLine(minPt)); titlePt = minPt; }
  return { titlePt, titleLines: lines };
}

function splitTitleLines(title, charsPerLine) {
  if (title.length <= charsPerLine) return [title];
  const breakAfter = new Set([...' ,-;:!?./', ...' \t']);
  const lines = []; let remaining = title;
  while (remaining.length > charsPerLine) {
    let breakAt = -1;
    for (let i = charsPerLine; i >= Math.floor(charsPerLine * 0.6); i--) {
      if (i < remaining.length && breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
    }
    if (breakAt === -1) { const l = Math.min(remaining.length, Math.ceil(charsPerLine * 1.3));
      for (let i = charsPerLine + 1; i < l; i++) { if (breakAfter.has(remaining[i - 1])) { breakAt = i; break; } }
    }
    if (breakAt === -1) breakAt = charsPerLine;
    lines.push(remaining.slice(0, breakAt).trim()); remaining = remaining.slice(breakAt).trim();
  }
  if (remaining) lines.push(remaining);
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) { const last = lines.pop(); lines[lines.length - 1] += last; }
  return lines;
}

function calcCoverSpacing(params) {
  const { titleLineCount = 1, titlePt = 36, hasSubtitle = false, hasEnglishLabel = false,
    metaLineCount = 0, fixedHeight = 800, pageHeight = 16838, marginTop = 0, marginBottom = 0 } = params;
  const SAFETY = 1200, usableHeight = pageHeight - marginTop - marginBottom - SAFETY;
  const titleHeight = titleLineCount * (titlePt * 23 + 200);
  const subtitleHeight = hasSubtitle ? (12 * 23 + 600) : 0;
  const englishLabelHeight = hasEnglishLabel ? (9 * 23 + 600) : 0;
  const metaHeight = metaLineCount * (10 * 23 + 100);
  const implicitParaHeight = 3 * 300;
  const contentHeight = titleHeight + subtitleHeight + englishLabelHeight + metaHeight + fixedHeight + implicitParaHeight;
  const safeRemaining = Math.max(usableHeight - contentHeight, 400);
  const FOOTER_MIN = 800;
  const rawBottom = Math.floor(safeRemaining * 0.45);
  const bottomSpacing = Math.max(rawBottom, FOOTER_MIN);
  const topSpacing = Math.max(Math.floor(safeRemaining * 0.45) - Math.max(0, FOOTER_MIN - rawBottom), 400);
  return { topSpacing, midSpacing: Math.max(safeRemaining - topSpacing - bottomSpacing, 0), bottomSpacing };
}

function buildCoverR1(config) {
  const padL = 1200, padR = 800;
  const availableWidth = 11906 - padL - padR - 300;
  const { titlePt, titleLines } = calcTitleLayout(config.title, availableWidth, 40, 24);
  const titleSize = titlePt * 2;
  const spacing = calcCoverSpacing({
    titleLineCount: titleLines.length, titlePt, hasSubtitle: !!config.subtitle,
    hasEnglishLabel: !!config.englishLabel, metaLineCount: (config.metaLines || []).length, fixedHeight: 400,
  });
  const accentLeft = { style: BorderStyle.SINGLE, size: 8, color: c(P.accent), space: 12 };
  const children = [];
  children.push(new Paragraph({ spacing: { before: spacing.topSpacing } }));
  if (config.englishLabel) {
    children.push(new Paragraph({
      indent: { left: padL, right: padR }, spacing: { after: 500 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: c(P.accent), space: 8 } },
      children: [new TextRun({ text: config.englishLabel.split("").join("  "), size: 18, color: c(P.accent), font: { ascii: "Calibri" }, characterSpacing: 40 })],
    }));
  }
  for (let i = 0; i < titleLines.length; i++) {
    children.push(new Paragraph({
      indent: { left: padL },
      spacing: { after: i < titleLines.length - 1 ? 100 : 300, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
      children: [new TextRun({ text: titleLines[i], size: titleSize, bold: true, color: c(P.primary), font: { ascii: "Arial" } })],
    }));
  }
  if (config.subtitle) {
    children.push(new Paragraph({ indent: { left: padL }, spacing: { after: 800 },
      children: [new TextRun({ text: config.subtitle, size: 24, color: "B0B8C0", font: { ascii: "Arial" } })],
    }));
  }
  for (const line of (config.metaLines || [])) {
    children.push(new Paragraph({ indent: { left: padL + 200 }, spacing: { after: 80 }, border: { left: accentLeft },
      children: [new TextRun({ text: line, size: 24, color: "90989F", font: { ascii: "Arial" } })],
    }));
  }
  children.push(new Paragraph({ spacing: { before: spacing.bottomSpacing } }));
  children.push(new Paragraph({
    indent: { left: padL, right: padR },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: c(P.accent), space: 8 } }, spacing: { before: 200 },
    children: [
      new TextRun({ text: config.footerLeft || "", size: 16, color: "687078", font: { ascii: "Arial" } }),
      new TextRun({ text: "                                                    " }),
      new TextRun({ text: config.footerRight || "", size: 16, color: "687078", font: { ascii: "Arial" } }),
    ],
  }));
  return [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED, borders: allNoBorders,
    rows: [new TableRow({ height: { value: 16838, rule: "exact" }, children: [new TableCell({
      shading: { type: ShadingType.CLEAR, fill: cp }, borders: noBorders, children,
    })] })],
  })];
}

// ─── Body helpers ───
function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, color: c(P.body), font: { ascii: "Arial" } })],
  });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, bold: true, size: 28, color: c(P.body), font: { ascii: "Arial" } })],
  });
}
function sceneHeader(time, scene) {
  return new Paragraph({ spacing: { before: 300, after: 100 },
    children: [
      new TextRun({ text: `[${time}]  `, bold: true, size: 24, color: c(P.accent), font: { ascii: "Calibri" } }),
      new TextRun({ text: scene, bold: true, size: 24, color: c(P.body), font: { ascii: "Calibri" } }),
    ],
  });
}
function visual(text) {
  return new Paragraph({ spacing: { line: 312, after: 100 }, indent: { left: 480 },
    children: [
      new TextRun({ text: "VISUAL: ", bold: true, size: 22, color: c(P.accent), font: { ascii: "Calibri" } }),
      new TextRun({ text, italics: true, size: 22, color: c(P.secondary), font: { ascii: "Calibri" } }),
    ],
  });
}
function narration(text) {
  return new Paragraph({ spacing: { line: 312, after: 100 }, indent: { left: 480 },
    children: [
      new TextRun({ text: "NARRATION: ", bold: true, size: 22, color: c(P.body), font: { ascii: "Calibri" } }),
      new TextRun({ text, size: 22, color: c(P.body), font: { ascii: "Calibri" } }),
    ],
  });
}
function sfx(text) {
  return new Paragraph({ spacing: { line: 312, after: 100 }, indent: { left: 480 },
    children: [
      new TextRun({ text: "SFX: ", bold: true, size: 22, color: c(P.accent), font: { ascii: "Calibri" } }),
      new TextRun({ text, size: 22, color: c(P.secondary), font: { ascii: "Calibri" } }),
    ],
  });
}
function onscreen(text) {
  return new Paragraph({ spacing: { line: 312, after: 100 }, indent: { left: 480 },
    children: [
      new TextRun({ text: "ON SCREEN: ", bold: true, size: 22, color: c(P.accent), font: { ascii: "Calibri" } }),
      new TextRun({ text, italics: true, size: 22, color: c(P.body), font: { ascii: "Calibri" } }),
    ],
  });
}

const doc = new Document({
  styles: { default: { document: {
    run: { font: { ascii: "Calibri" }, size: 24, color: c(P.body) },
    paragraph: { spacing: { line: 312 } },
  }}},
  sections: [
    // ── Cover ──
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 0, bottom: 0, left: 0, right: 0 } } },
      children: buildCoverR1({
        title: "ScanLearn Video Script",
        subtitle: "3-Minute Demo Video Storyboard",
        englishLabel: "GEMMA 4 GOOD HACKATHON",
        metaLines: ["Duration: 3 Minutes", "Track: Future of Education", "Made with \u2764 using Gemma 4 by Nawang Dorjay"],
        footerLeft: "Made with \u2764 using Gemma 4", footerRight: "Nawang Dorjay",
        palette: { bg: cp, primary: P.primary, accent: P.accent },
      }),
    },
    // ── Body ──
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 }, pageNumbers: { start: 1 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.secondary) })] })] }) },
      children: [
        // ─── Pre-Production Notes ───
        h1("Pre-Production Notes"),

        h2("Tone and Style"),
        new Paragraph({ spacing: { line: 312, after: 160 }, alignment: AlignmentType.JUSTIFIED,
          children: [new TextRun({ text: "The video should feel cinematic, emotional, and urgent. Open with a cold open, no title card. Use natural lighting and handheld camera work for authenticity. The color palette shifts from warm amber tones in the classroom scenes to cool blue-white tones during the tech demonstration, visually representing the transformation from analog to digital. Music should start sparse with a single piano motif, building to an inspirational swell during the demo reveal.", size: 24, color: c(P.body), font: { ascii: "Calibri" } })],
        }),

        h2("Key Characters"),
        new Paragraph({ spacing: { line: 312, after: 80 }, children: [
          new TextRun({ text: "Teacher (Priya): ", bold: true, size: 24, color: c(P.body) }),
          new TextRun({ text: "A dedicated educator in a modest classroom. She represents the millions of teachers who do extraordinary work with limited resources.", size: 24, color: c(P.body) }),
        ]}),
        new Paragraph({ spacing: { line: 312, after: 80 }, children: [
          new TextRun({ text: "Student (Aarav): ", bold: true, size: 24, color: c(P.body) }),
          new TextRun({ text: "A curious 12-year-old who struggles to keep up with standardized material but lights up when learning is adapted to his level.", size: 24, color: c(P.body) }),
        ]}),

        // ─── Scene 1: Cold Open ───
        h1("Scene 1: The Problem (0:00 - 0:35)"),

        sceneHeader("0:00 - 0:08", "Cold Open - The Classroom"),
        visual("Handheld close-up of a worn textbook page. Dust particles float in a beam of sunlight coming through a window. The camera slowly pulls back to reveal a bustling but underserved classroom with chipped walls and mismatched desks. Children in uniform lean over shared textbooks."),
        sfx("Ambient classroom sounds: children murmuring, a bell in the distance, pages turning."),
        narration("\"In a small classroom on the outskirts of any city in the world, a single textbook serves fifty children.\""),

        sceneHeader("0:08 - 0:20", "The Teacher's Reality"),
        visual("Close-up of Priya's hands writing quiz questions on a chalkboard, her chalk dust-covered fingers moving methodically. Cut to her sitting at a desk late at night, lamp flickering, manually transcribing questions from a textbook onto lined paper."),
        narration("\"Teachers like Priya spend hours every week crafting quizzes by hand, transcribing from worn pages, hoping to reach every student at their level.\""),

        sceneHeader("0:20 - 0:35", "The Student's Experience"),
        visual("Split screen: On the left, a student confidently answers a question and looks bored. On the right, Aarav stares at the same question, confused. The camera slowly zooms into Aarav's frustrated expression. The quiz paper in front of him has a red mark. Text overlay appears: \"Same quiz. Different students. One-size-fits-none.\""),
        narration("\"But when every student gets the same questions at the same difficulty, someone always gets left behind.\""),
        sfx("Soft piano note. Music fades out."),

        // ─── Scene 2: The Reveal ───
        h1("Scene 2: The Reveal (0:35 - 1:10)"),

        sceneHeader("0:35 - 0:45", "Title Card + Tagline"),
        onscreen("\"ScanLearn\" in bold white text on a dark background with a subtle cyan glow. Below: \"Transform Any Textbook Into an Adaptive Quiz. Powered by Gemma 4.\""),
        sfx("Subtle whoosh transition sound. Music picks up with an inspirational electronic beat."),
        narration("\"What if any textbook page could become an interactive, personalized quiz in seconds?\""),

        sceneHeader("0:45 - 1:10", "Live Demo - The Upload"),
        visual("Screen recording of the ScanLearn web app. Priya's point of view: she opens the app on a tablet, taps the upload button, and photographs a page from a biology textbook showing a diagram of the human heart. The image uploads with a smooth animation."),
        onscreen("The app shows: \"Image uploaded. Analyzing content with Gemma 4 Multimodal...\""),
        narration("\"ScanLearn uses Gemma 4's multimodal AI to read and understand any textbook page, including diagrams, equations, and complex layouts.\""),
        visual("Animation showing the AI pipeline: the textbook image flows through a processing visualization, extracting text blocks and diagram elements. The words \"Gemma 4 Multimodal Understanding\" pulse on screen."),
        sfx("Soft digital processing sounds."),

        // ─── Scene 3: The Magic ───
        h1("Scene 3: The Magic (1:10 - 2:00)"),

        sceneHeader("1:10 - 1:30", "Quiz Generation"),
        visual("Screen recording: Priya selects \"Intermediate\" difficulty, chooses \"Mixed Question Types,\" and selects \"Hindi\" as the language. She taps \"Generate Quiz.\" A loading animation plays for 2-3 seconds. Quiz cards appear one by one with a smooth staggered animation."),
        onscreen("Quiz question: \"Which chamber of the heart pumps oxygenated blood to the body?\" with four MCQ options."),
        narration("\"With one tap, ScanLearn generates a full quiz adapted to the student's level, in their language, with questions that test real understanding.\""),

        sceneHeader("1:30 - 2:00", "Student Interaction"),
        visual("Cut to Aarav using the app. He selects the correct answer to the heart question. A green checkmark animation plays, and a progress bar advances. The next question appears, slightly harder. He answers correctly again. Close-up of his face: a smile breaks through. The quiz shows he is on a 4-question streak."),
        onscreen("Adaptive difficulty indicator: \"Level adjusting... Great progress!\""),
        narration("\"And it adapts in real time. Get a question right, and the next one pushes you further. Struggle, and the system gently guides you back. Every student gets their own learning path.\""),
        sfx("Soft success chime when Aarav answers correctly. Music builds."),

        // ─── Scene 4: The Impact ───
        h1("Scene 4: The Impact (2:00 - 2:40)"),

        sceneHeader("2:00 - 2:20", "Results Dashboard"),
        visual("Screen recording of the results page. A circular score animation fills to 85%. Below, a detailed breakdown shows each question with correct/incorrect indicators, explanations, and topic tags. A \"Generate New Quiz\" button pulses gently."),
        onscreen("\"Aarav - Score: 85% - Strengths: Circulatory System. Focus Area: Blood Components.\""),
        narration("\"After each quiz, students and teachers get a detailed breakdown, identifying strengths and areas for improvement.\""),

        sceneHeader("2:20 - 2:40", "The Ripple Effect"),
        visual("Montage sequence with quick cuts: A teacher in a rural school uses ScanLearn on a laptop with no internet. A homeschooling parent generates a quiz from a library book. A university student creates practice questions from lecture slides. Each scene is lit with warm, hopeful tones."),
        narration("\"Built to run entirely offline on a single laptop, ScanLearn works where the internet does not. It generates quizzes in English, Spanish, Hindi, and French. And because it runs locally, student data never leaves the device.\""),
        sfx("Music swells to its peak."),

        // ─── Scene 5: Closing ───
        h1("Scene 5: The Closing (2:40 - 3:00)"),

        sceneHeader("2:40 - 2:50", "Technical Credibility"),
        visual("Clean motion graphics showing the architecture diagram. Components light up sequentially: User Layer, API Layer, AI Processing Layer (Gemma 4), Data Layer. Each element has a brief label. The whole animation takes 8-10 seconds."),
        onscreen("\"Gemma 4 Multimodal + Function Calling + Local Deployment\""),
        narration("\"Powered by Gemma 4's multimodal understanding and native function calling, ScanLearn is not a prototype. It is a working, deployable solution.\""),

        sceneHeader("2:50 - 3:00", "Final CTA"),
        visual("Return to the classroom. Aarav looks directly at the camera and smiles. Cut to the ScanLearn logo on a clean dark background. Below it: \"ScanLearn\" and \"Try the live demo at scanlearn.demo\" with a QR code."),
        onscreen("\"ScanLearn - Every Page is a Lesson. Every Student is Seen.\""),
        sfx("Music resolves to a single, warm piano chord. Fade to black."),
        narration("\"Because when the right tools are in everyone's hands, the possibilities for education are truly endless.\""),

        // ─── Post-Production Notes ───
        h1("Post-Production Notes"),
        new Paragraph({ spacing: { line: 312, after: 80 }, children: [
          new TextRun({ text: "Target Duration: ", bold: true, size: 24, color: c(P.body) }),
          new TextRun({ text: "Exactly 3:00. If running long, trim the impact montage (2:20-2:40) by reducing from 4 to 2 quick cuts. If running short, add 5-10 seconds of Priya's reaction to seeing the generated quiz for the first time.", size: 24, color: c(P.body) }),
        ]}),
        new Paragraph({ spacing: { line: 312, after: 80 }, children: [
          new TextRun({ text: "Music: ", bold: true, size: 24, color: c(P.body) }),
          new TextRun({ text: "Use royalty-free inspirational/cinematic track. Start with solo piano, introduce soft electronic elements at 0:45, build to full orchestral swell at 2:00, resolve to single chord at 3:00.", size: 24, color: c(P.body) }),
        ]}),
        new Paragraph({ spacing: { line: 312, after: 80 }, children: [
          new TextRun({ text: "Color Grading: ", bold: true, size: 24, color: c(P.body) }),
          new TextRun({ text: "Warm amber for classroom scenes (human, analog). Cool blue-white for tech demo (digital, AI). Transition gradually during the upload sequence to represent the transformation.", size: 24, color: c(P.body) }),
        ]}),
        new Paragraph({ spacing: { line: 312, after: 80 }, children: [
          new TextRun({ text: "Accessibility: ", bold: true, size: 24, color: c(P.body) }),
          new TextRun({ text: "Include closed captions in English. Ensure all on-screen text is large enough to read on mobile. Demo screen recordings should use a clean, uncluttered browser window.", size: 24, color: c(P.body) }),
        ]}),
      ],
    },
  ],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/home/z/my-project/download/scanlearn/docs/Video_Script_ScanLearn.docx", buf);
  console.log("Video Script generated successfully!");
});
