import type { QuizQuestion } from '@/lib/types';

export const sampleQuizQuestions: QuizQuestion[] = [
  {
    type: 'mcq',
    id: 1,
    question: 'What is the primary function of the mitochondria in a cell?',
    options: [
      'Protein synthesis',
      'Energy production (ATP)',
      'Cell division',
      'Waste removal',
    ],
    correctAnswer: 1,
    explanation:
      'Mitochondria are often called the "powerhouse of the cell" because they generate most of the cell\'s supply of adenosine triphosphate (ATP), used as chemical energy.',
  },
  {
    type: 'mcq',
    id: 2,
    question: 'Which organelle is responsible for photosynthesis in plant cells?',
    options: ['Mitochondria', 'Golgi apparatus', 'Chloroplast', 'Endoplasmic reticulum'],
    correctAnswer: 2,
    explanation:
      'Chloroplasts contain chlorophyll and are the site of photosynthesis, converting light energy into chemical energy stored in glucose.',
  },
  {
    type: 'true_false',
    id: 3,
    question: 'The cell membrane is selectively permeable, allowing only certain substances to pass through.',
    correctAnswer: true,
    explanation:
      'The cell membrane is selectively permeable, controlling what enters and exits the cell to maintain homeostasis.',
  },
  {
    type: 'true_false',
    id: 4,
    question: 'DNA is found exclusively in the nucleus of eukaryotic cells.',
    correctAnswer: false,
    explanation:
      'While most DNA is in the nucleus, eukaryotic cells also contain mitochondrial DNA (mtDNA) and, in plants, chloroplast DNA.',
  },
  {
    type: 'fill_blank',
    id: 5,
    question: 'The process by which cells divide to form two identical daughter cells is called __________.',
    correctAnswer: 'mitosis',
    explanation:
      'Mitosis is the process of cell division that produces two genetically identical daughter cells from a single parent cell.',
  },
  {
    type: 'mcq',
    id: 6,
    question: 'What is the role of ribosomes in the cell?',
    options: [
      'Energy production',
      'Lipid synthesis',
      'Protein synthesis',
      'DNA replication',
    ],
    correctAnswer: 2,
    explanation:
      'Ribosomes are the cellular structures responsible for protein synthesis, translating mRNA into amino acid chains.',
  },
  {
    type: 'short_answer',
    id: 7,
    question: 'Explain the difference between passive and active transport across a cell membrane.',
    correctAnswer:
      'Passive transport moves substances down their concentration gradient without energy input (e.g., diffusion, osmosis). Active transport moves substances against their gradient, requiring ATP energy (e.g., sodium-potassium pump).',
    explanation:
      'The key difference is that passive transport does not require energy while active transport requires ATP to move substances against their concentration gradient.',
  },
  {
    type: 'fill_blank',
    id: 8,
    question: 'The __________ is the control center of the cell, containing the genetic material.',
    correctAnswer: 'nucleus',
    explanation:
      'The nucleus contains the cell\'s DNA and controls gene expression, regulating cell activities.',
  },
  {
    type: 'mcq',
    id: 9,
    question: 'Which structure provides structural support and protection to plant cells?',
    options: [
      'Cell membrane',
      'Cytoplasm',
      'Cell wall',
      'Vacuole',
    ],
    correctAnswer: 2,
    explanation:
      'The cell wall is a rigid outer layer made of cellulose that provides structural support and protection to plant cells.',
  },
  {
    type: 'true_false',
    id: 10,
    question: 'Enzymes are consumed in the chemical reactions they catalyze.',
    correctAnswer: false,
    explanation:
      'Enzymes are biological catalysts that speed up reactions without being consumed. They can be reused many times.',
  },
];
