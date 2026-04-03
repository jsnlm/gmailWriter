import React from "react";

interface Props {
  instructions: string;
  onChange: (value: string) => void;
}

export function PromptInstructionsSection({ instructions, onChange }: Props) {
  return (
    <section className="settings-section">
      <h2>Writing Instructions</h2>
      <p className="section-desc">
        These instructions are added to every draft generation prompt. Use this to set rules about
        how responses should be written — e.g. avoiding AI-sounding patterns, preferred phrasing,
        things to always or never include.
      </p>

      <div className="field-group">
        <label htmlFor="prompt-instructions">Instructions</label>
        <textarea
          id="prompt-instructions"
          className="instructions-textarea"
          value={instructions}
          onChange={(e) => onChange(e.target.value)}
          rows={10}
          placeholder={`Examples of what you can specify here:\n- Avoid phrases like "I hope this email finds you well", "Please don't hesitate to reach out", or "Best regards"\n- Never use bullet points in emails\n- Don't start sentences with "I"\n- Keep responses under 3 short paragraphs\n- Sound direct and confident, not overly polite`}
        />
      </div>
    </section>
  );
}
