import type { ReactNode } from 'react';
import { CharacterList } from './characters/CharacterList';
import { ChatView } from './chat/ChatView';
import { useRoleplayStore } from '../store';

interface LayoutProps {
  main: ReactNode;
}

export function Layout({ main }: LayoutProps) {
  return (
    <div className="mianix-layout">
      <aside className="mianix-sidebar">
        <CharacterList />
      </aside>
      <main className="mianix-main">{main}</main>
    </div>
  );
}

// Main content area with chat
export function MainContent() {
  const { currentCharacter } = useRoleplayStore();

  return (
    <div className="mianix-main-content">
      <ChatView character={currentCharacter} />
    </div>
  );
}
