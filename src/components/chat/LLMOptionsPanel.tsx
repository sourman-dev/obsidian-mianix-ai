import React, { useState } from 'react';
import type { LLMOptions } from '../../types';

interface LLMOptionsPanelProps {
  options: LLMOptions;
  onChange: (options: LLMOptions) => void;
  disabled?: boolean;
}

/**
 * Panel for editing LLM options per session.
 * Appears in chat header with collapsible settings.
 */
export function LLMOptionsPanel({
  options,
  onChange,
  disabled,
}: LLMOptionsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (key: keyof LLMOptions, value: number) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <div className="mianix-llm-options">
      <button
        className="mianix-llm-options-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="LLM Settings"
      >
        ⚙️
      </button>

      {isOpen && (
        <div className="mianix-llm-options-panel">
          <div className="mianix-option-row">
            <label>
              Temperature
              <span className="mianix-option-value">{options.temperature}</span>
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={options.temperature}
              onChange={(e) =>
                handleChange('temperature', parseFloat(e.target.value))
              }
              disabled={disabled}
            />
          </div>

          <div className="mianix-option-row">
            <label>
              Top P
              <span className="mianix-option-value">{options.topP}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={options.topP}
              onChange={(e) =>
                handleChange('topP', parseFloat(e.target.value))
              }
              disabled={disabled}
            />
          </div>

          <div className="mianix-option-row">
            <label>
              Response Length
              <span className="mianix-option-value">
                {options.responseLength} words
              </span>
            </label>
            <input
              type="range"
              min="100"
              max="2000"
              step="50"
              value={options.responseLength}
              onChange={(e) =>
                handleChange('responseLength', parseInt(e.target.value, 10))
              }
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  );
}
