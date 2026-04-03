import React from "react";

interface Props {
  emails: string[];
  onChange: (emails: string[]) => void;
}

export function SampleEmailsSection({ emails, onChange }: Props) {
  const update = (index: number, value: string) => {
    onChange(emails.map((e, i) => (i === index ? value : e)));
  };

  const remove = (index: number) => {
    onChange(emails.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([...emails, ""]);
  };

  return (
    <section className="settings-section">
      <h2>Sample Emails</h2>
      <p className="section-desc">
        Paste emails you've written in the past. The AI will use these to match your writing style and voice.
      </p>

      <div className="email-list">
        {emails.map((email, i) => (
          <div key={i} className="email-item">
            <div className="email-item-header">
              <span className="email-label">Email {i + 1}</span>
              <button className="remove-btn" onClick={() => remove(i)} title="Remove">
                Remove
              </button>
            </div>
            <textarea
              className="email-textarea"
              placeholder="Paste an email you wrote here..."
              value={email}
              onChange={(e) => update(i, e.target.value)}
              rows={6}
            />
          </div>
        ))}
      </div>

      <button className="add-btn" onClick={add}>+ Add sample email</button>
    </section>
  );
}
