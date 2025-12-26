import React, { useEffect, useRef } from 'react';
import { MessageItem } from './MessageItem';
import type { DialogueMessageWithContent, CharacterCardWithPath } from '../../types';

interface MessageListProps {
  messages: DialogueMessageWithContent[];
  character: CharacterCardWithPath | null;
  isLoading?: boolean;
  streamingContent?: string;
  onEdit?: (filePath: string, content: string) => void;
  onDelete?: (filePath: string) => void;
  onRegenerate?: (filePath: string) => void;
}

export function MessageList({
  messages,
  character,
  isLoading,
  streamingContent,
  onEdit,
  onDelete,
  onRegenerate,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or streaming content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  if (!character) {
    return (
      <div className="mianix-message-list empty">
        <div className="mianix-empty-state">
          <p>Select a character to start chatting</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="mianix-message-list empty">
        <div className="mianix-empty-state">
          <p>No messages yet. Start the conversation!</p>
        </div>
      </div>
    );
  }

  const isStreaming = Boolean(streamingContent);

  // Find last assistant message index (for regenerate button)
  const lastAssistantIndex = messages.reduceRight(
    (acc, msg, idx) => (acc === -1 && msg.role === 'assistant' ? idx : acc),
    -1
  );

  return (
    <div className="mianix-message-list">
      {messages.map((msg, index) => (
        <MessageItem
          key={msg.id}
          message={msg}
          characterName={character.name}
          characterAvatar={character.avatarUrl}
          isLastAssistant={index === lastAssistantIndex}
          onEdit={onEdit}
          onDelete={onDelete}
          onRegenerate={onRegenerate}
        />
      ))}

      {/* Streaming message */}
      {isStreaming && (
        <div className="mianix-message assistant">
          <div className="mianix-message-avatar">
            {character.avatarUrl ? (
              <img src={character.avatarUrl} alt={character.name} />
            ) : (
              <span className="mianix-avatar-placeholder">
                {character.name[0]}
              </span>
            )}
          </div>
          <div className="mianix-message-content">
            <div className="mianix-message-name">{character.name}</div>
            <div className="mianix-message-text">{streamingContent}</div>
          </div>
        </div>
      )}

      {/* Typing indicator (before streaming starts) */}
      {isLoading && !isStreaming && (
        <div className="mianix-message assistant loading">
          <div className="mianix-message-avatar">
            {character.avatarUrl ? (
              <img src={character.avatarUrl} alt={character.name} />
            ) : (
              <span className="mianix-avatar-placeholder">
                {character.name[0]}
              </span>
            )}
          </div>
          <div className="mianix-message-content">
            <div className="mianix-typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
