import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/app-context';
import { LorebookService } from '../../services/lorebook-service';
import type { LorebookEntry } from '../../types/lorebook';

interface LorebookIndicatorProps {
  characterFolderPath: string | null;
  recentMessages: string[];
}

/**
 * Shows active lorebook entries count with hover tooltip
 * Phase 1: Display only, no editing
 */
export function LorebookIndicator({
  characterFolderPath,
  recentMessages,
}: LorebookIndicatorProps) {
  const { app, settings } = useApp();
  const [activeEntries, setActiveEntries] = useState<LorebookEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const lorebookService = useMemo(() => new LorebookService(app), [app]);

  useEffect(() => {
    if (!characterFolderPath) {
      setActiveEntries([]);
      return;
    }

    const loadEntries = async () => {
      try {
        const entries = await lorebookService.getActiveEntries(
          characterFolderPath,
          recentMessages,
          settings.lorebookScanDepth
        );
        setActiveEntries(entries);
      } catch (error) {
        console.warn('Failed to load lorebook entries:', error);
        setActiveEntries([]);
      }
    };

    loadEntries();
  }, [characterFolderPath, recentMessages, lorebookService, settings.lorebookScanDepth]);

  if (!characterFolderPath || activeEntries.length === 0) {
    return null;
  }

  return (
    <div className="mianix-lorebook-indicator">
      <button
        className="mianix-lorebook-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        title={`${activeEntries.length} lorebook entries active`}
      >
        📚 {activeEntries.length}
      </button>

      {isExpanded && (
        <div className="mianix-lorebook-tooltip">
          <div className="mianix-lorebook-header">Active Lorebook Entries</div>
          <ul className="mianix-lorebook-list">
            {activeEntries.map((entry) => (
              <li key={entry.id} className="mianix-lorebook-item">
                <span className="mianix-lorebook-name">{entry.name}</span>
                {entry.alwaysActive && (
                  <span className="mianix-lorebook-badge">always</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
