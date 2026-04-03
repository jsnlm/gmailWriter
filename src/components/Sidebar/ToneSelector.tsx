import React from "react";

const TONES = ["Casual", "Friendly", "Formal", "Professional", "Concise", "Warm"];

interface Props {
  tone: string;
  onChange: (tone: string) => void;
}

export function ToneSelector({ tone, onChange }: Props) {
  return (
    <div className="tone-selector">
      <label htmlFor="tone-select">Tone</label>
      <select
        id="tone-select"
        value={tone}
        onChange={(e) => onChange(e.target.value)}
      >
        {TONES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
    </div>
  );
}
