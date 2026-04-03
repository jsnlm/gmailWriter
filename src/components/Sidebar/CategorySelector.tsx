import React, { useState } from "react";

interface Props {
  categories: string[];
  selected: string | null;
  customInstructions: string;
  onSelect: (category: string) => void;
  onCustomInstructions: (text: string) => void;
}

export function CategorySelector({
  categories,
  selected,
  customInstructions,
  onSelect,
  onCustomInstructions,
}: Props) {
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="category-selector">
      <p className="section-label">How do you want to respond?</p>
      <div className="category-list">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-card ${selected === cat && !showCustom ? "selected" : ""}`}
            onClick={() => {
              onSelect(cat);
              setShowCustom(false);
            }}
          >
            {cat}
          </button>
        ))}
        <button
          className={`category-card custom-card ${showCustom ? "selected" : ""}`}
          onClick={() => {
            setShowCustom(true);
            onSelect("");
          }}
        >
          + Add your own instructions
        </button>
      </div>

      {showCustom && (
        <textarea
          className="custom-instructions"
          placeholder="Describe what you want to say..."
          value={customInstructions}
          onChange={(e) => onCustomInstructions(e.target.value)}
          rows={3}
          autoFocus
        />
      )}
    </div>
  );
}
