import React, { useState } from 'react';
import type { DialogueMessageWithContent } from '../../types';

interface MessageItemProps {
  message: DialogueMessageWithContent;
  characterName?: string;
  characterAvatar?: string;
  isLastAssistant?: boolean;
  onEdit?: (filePath: string, content: string) => void;
  onDelete?: (filePath: string) => void;
  onRegenerate?: (filePath: string) => void;
}

export function MessageItem({
  message,
  characterName,
  characterAvatar,
  isLastAssistant,
  onEdit,
  onDelete,
  onRegenerate,
}: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const isUser = message.role === 'user';

  const handleSaveEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(message.filePath, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  return (
    <div className={`mianix-message ${isUser ? 'user' : 'assistant'}`}>
      {!isUser && (
        <div className="mianix-message-avatar">
          {characterAvatar ? (
            <img src={characterAvatar} alt={characterName || 'AI'} />
          ) : (
            <span className="mianix-avatar-placeholder">
              {characterName?.[0] || 'A'}
            </span>
          )}
        </div>
      )}
      <div className="mianix-message-content">
        {!isUser && characterName && (
          <div className="mianix-message-name">{characterName}</div>
        )}

        {isEditing ? (
          <div className="mianix-message-edit">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              autoFocus
            />
            <div className="mianix-edit-actions">
              <button onClick={handleSaveEdit} className="mianix-btn-save">
                Save
              </button>
              <button onClick={handleCancelEdit} className="mianix-btn-cancel">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mianix-message-text">{message.content}</div>
        )}

        <div className="mianix-message-footer">
          <span className="mianix-message-time">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>

          {!isEditing && (
            <div className="mianix-message-actions">
              <button
                onClick={() => setIsEditing(true)}
                title="Edit"
                className="mianix-action-btn"
              >
                ✏️
              </button>
              {!isUser && isLastAssistant && onRegenerate && (
                <button
                  onClick={() => onRegenerate(message.filePath)}
                  title="Regenerate"
                  className="mianix-action-btn"
                >
                  🔄
                </button>
              )}
              <button
                onClick={() => onDelete?.(message.filePath)}
                title="Delete"
                className="mianix-action-btn mianix-action-danger"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
