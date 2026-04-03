import React, { useState } from "react";

interface DraftCardProps {
  draft: string;
  index: number;
  onInsert: (text: string) => void;
}

function DraftCard({ draft, index, onInsert }: DraftCardProps) {
  const [text, setText] = useState(draft);

  return (
    <div className="draft-card">
      <div className="draft-header">
        <span className="draft-label">Draft {index + 1}</span>
      </div>
      <textarea
        className="draft-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
      />
      <button className="btn btn-primary insert-btn" onClick={() => onInsert(text)}>
        Insert into Gmail
      </button>
    </div>
  );
}

interface Props {
  drafts: string[];
  isGenerating: boolean;
  onGenerateAnother: () => void;
  onInsert: (text: string) => void;
}

export function DraftViewer({ drafts, isGenerating, onGenerateAnother, onInsert }: Props) {
  return (
    <div className="draft-viewer">
      {drafts.map((draft, i) => (
        <DraftCard key={i} draft={draft} index={i} onInsert={onInsert} />
      ))}

      <button
        className="btn btn-secondary generate-more-btn"
        onClick={onGenerateAnother}
        disabled={isGenerating}
      >
        {isGenerating ? "Generating..." : "Generate another variation"}
      </button>
    </div>
  );
}
