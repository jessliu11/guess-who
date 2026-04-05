import { create } from 'zustand';
import type { GameSession, Character, PlayerRole } from '../types/game.types';

interface GameState {
  session: GameSession | null;
  characters: Character[];           // all 24 characters in the pool (ordered)
  myRole: PlayerRole | null;
  myEliminated: string[];            // local optimistic eliminate set
  isMyTurn: () => boolean;

  setSession: (session: GameSession) => void;
  setCharacters: (chars: Character[]) => void;
  setMyRole: (role: PlayerRole) => void;
  syncFromServer: (session: GameSession) => void;
  eliminateLocally: (characterId: string) => void;
  clearGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  session: null,
  characters: [],
  myRole: null,
  myEliminated: [],

  isMyTurn: () => {
    const { session, myRole } = get();
    return session?.current_turn === myRole;
  },

  setSession: (session) => set({ session }),

  setCharacters: (characters) => set({ characters }),

  setMyRole: (myRole) => set({ myRole }),

  syncFromServer: (session) => {
    const { myRole, myEliminated } = get();
    // On server sync, reconcile local eliminated with server eliminated
    const serverEliminated =
      myRole === 'host' ? session.host_eliminated : session.guest_eliminated;
    // Merge: keep local items that aren't server-confirmed yet (optimistic)
    const merged = Array.from(new Set([...serverEliminated, ...myEliminated]));
    set({ session, myEliminated: merged });
  },

  eliminateLocally: (characterId) => {
    set((state) => ({
      myEliminated: state.myEliminated.includes(characterId)
        ? state.myEliminated.filter((id) => id !== characterId)
        : [...state.myEliminated, characterId],
    }));
  },

  clearGame: () =>
    set({ session: null, characters: [], myRole: null, myEliminated: [] }),
}));
