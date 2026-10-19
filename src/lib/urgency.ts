import type { Category, Urgency } from "./types";

const BASE: Record<Category, number> = {
  pothole: 3,
  waterlogging: 3,
  "open-manhole": 4,
  other: 2,
};

interface Clue {
  label: string;
  pattern: RegExp;
  points: number;
}

/**
 * Words that make a report more or less urgent, in English and Bangla.
 * This is a stand-in for the Bangla urgency ranker, which will use a language
 * model. It lets the report form show an estimate as you type.
 */
const CLUES: Clue[] = [
  {
    label: "children are mentioned",
    pattern: /child|kid|school|student|শিশু|স্কুল|ছাত্র|বাচ্চা/i,
    points: 1,
  },
  {
    label: "a hospital is mentioned",
    pattern: /hospital|clinic|ambulance|হাসপাতাল|ক্লিনিক|অ্যাম্বুলেন্স/i,
    points: 1,
  },
  {
    label: "someone was hurt or nearly hurt",
    pattern: /accident|injur|crash|fell|fall|hurt|দুর্ঘটনা|আহত|পড়ে/i,
    points: 1,
  },
  {
    label: "it is deep or large",
    pattern: /deep|huge|very big|large|গভীর|বিশাল|অনেক বড়/i,
    points: 1,
  },
  {
    label: "it is on a main road",
    pattern: /main road|highway|junction|flyover|মূল সড়ক|বড় রাস্তা|মোড়/i,
    points: 1,
  },
  {
    label: "it is dark there at night",
    pattern: /night|dark|রাত|অন্ধকার/i,
    points: 1,
  },
  {
    label: "it is described as small",
    pattern: /\bsmall\b|\bminor\b|ছোট/i,
    points: -1,
  },
];

export interface UrgencyEstimate {
  urgency: Urgency;
  reasons: string[];
}

/** Estimate urgency from the kind of hazard and the words in the description. */
export function estimateUrgency(text: string, category: Category): UrgencyEstimate {
  const matched = CLUES.filter((clue) => clue.pattern.test(text));
  const score = matched.reduce((sum, clue) => sum + clue.points, BASE[category]);
  const urgency = Math.min(5, Math.max(1, score)) as Urgency;
  return { urgency, reasons: matched.map((clue) => clue.label) };
}
