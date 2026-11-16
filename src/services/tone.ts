// The tone of a drafted email, as five qualities. Each quality is a scale with
// exactly one option chosen, so contradictory tones (casual and formal, brief
// and detailed) can't be picked together.
//
// Used by the sidebar's tone picker and by the prompt builder in llm.ts.

export interface ToneOption {
  value: string;
  /** One word, shown in the tone pill and the picker. */
  label: string;
  /** What the option means; shown as a tooltip and sent to the model. */
  hint?: string;
}

export interface ToneQuality {
  key: keyof Tone;
  label: string;
  /** In order from one end of the scale to the other. */
  options: ToneOption[];
}

export interface Tone {
  formality: string;
  warmth: string;
  length: string;
  energy: string;
  stance: string;
}

export const TONE_QUALITIES: ToneQuality[] = [
  {
    key: "formality",
    label: "Formality",
    options: [
      { value: "casual", label: "Casual" },
      { value: "professional", label: "Professional" },
      { value: "formal", label: "Formal" },
    ],
  },
  {
    key: "warmth",
    label: "Warmth",
    options: [
      { value: "warm", label: "Warm" },
      { value: "neutral", label: "Neutral" },
      { value: "direct", label: "Direct" },
    ],
  },
  {
    key: "length",
    label: "Length",
    options: [
      { value: "one-liner", label: "One-liner", hint: "1–2 sentences" },
      { value: "brief", label: "Brief", hint: "A short paragraph" },
      { value: "medium", label: "Medium", hint: "2–3 short paragraphs" },
      { value: "detailed", label: "Detailed", hint: "Several paragraphs" },
      { value: "thorough", label: "Thorough", hint: "Covers everything relevant, however long that takes" },
    ],
  },
  {
    key: "energy",
    label: "Energy",
    options: [
      { value: "calm", label: "Calm" },
      { value: "enthusiastic", label: "Enthusiastic" },
    ],
  },
  {
    key: "stance",
    label: "Stance",
    options: [
      { value: "confident", label: "Confident" },
      { value: "diplomatic", label: "Diplomatic" },
    ],
  },
];

export const DEFAULT_TONE: Tone = {
  formality: "casual",
  warmth: "warm",
  length: "brief",
  energy: "calm",
  stance: "confident",
};

/** The chosen option for a quality, falling back to the first if the value is unknown. */
export function chosenOption(quality: ToneQuality, tone: Tone): ToneOption {
  return quality.options.find((o) => o.value === tone[quality.key]) ?? quality.options[0];
}

/** One word per quality, in order, e.g. ["Casual", "Warm", "Brief", "Calm", "Confident"]. */
export function summarizeTone(tone: Tone): string[] {
  return TONE_QUALITIES.map((q) => chosenOption(q, tone).label);
}

/** For the prompt, e.g. "casual, warm, calm and confident. Length: brief (a short paragraph)". */
export function describeTone(tone: Tone): string {
  const words = TONE_QUALITIES.filter((q) => q.key !== "length").map((q) => chosenOption(q, tone).label.toLowerCase());
  const lengthQuality = TONE_QUALITIES.find((q) => q.key === "length")!;
  const length = chosenOption(lengthQuality, tone);
  const tail = words.pop();
  return `${words.join(", ")} and ${tail}. Length: ${length.label.toLowerCase()} (${length.hint!.toLowerCase()})`;
}
