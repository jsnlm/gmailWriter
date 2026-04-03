import React from "react";
import type { PersonalInfoEntry } from "../../types";

interface Props {
  entries: PersonalInfoEntry[];
  onChange: (entries: PersonalInfoEntry[]) => void;
}

export function PersonalInfoSection({ entries, onChange }: Props) {
  const update = (index: number, field: keyof PersonalInfoEntry, value: string) => {
    const updated = entries.map((e, i) =>
      i === index ? { ...e, [field]: value } : e
    );
    onChange(updated);
  };

  const remove = (index: number) => {
    onChange(entries.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([...entries, { key: "", value: "" }]);
  };

  return (
    <section className="settings-section">
      <h2>Personal Info</h2>
      <p className="section-desc">
        This info can be included in drafts (e.g. phone number, Calendly link). Add or remove fields freely.
      </p>

      <div className="info-list">
        {entries.map((entry, i) => (
          <div key={i} className="info-row">
            <input
              className="info-key"
              placeholder="Label (e.g. Phone)"
              value={entry.key}
              onChange={(e) => update(i, "key", e.target.value)}
            />
            <input
              className="info-value"
              placeholder="Value"
              value={entry.value}
              onChange={(e) => update(i, "value", e.target.value)}
            />
            <button className="remove-btn" onClick={() => remove(i)} title="Remove">✕</button>
          </div>
        ))}
      </div>

      <button className="add-btn" onClick={add}>+ Add field</button>
    </section>
  );
}
