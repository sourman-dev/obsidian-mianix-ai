import React, { useCallback, KeyboardEvent, useEffect, useRef } from 'react';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function MessageInput({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
  value: controlledValue,
  onChange: onControlledChange,
}: MessageInputProps) {
  // Use controlled or uncontrolled mode
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = React.useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const text = isControlled ? controlledValue : internalValue;
  const setText = isControlled
    ? (v: string) => onControlledChange?.(v)
    : setInternalValue;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSend = useCallback(() => {
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
    }
  }, [text, disabled, onSend, setText]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Send on Enter (without Shift)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="mianix-message-input">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        className="mianix-send-button"
        title="Send message"
      >
        ➤
      </button>
    </div>
  );
}
