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
  seedMyEliminated: (session: GameSession) => void;
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

  // Sync only mutates `session`. `myEliminated` is locally authoritative —
  // the user is the only writer of their own eliminated list, and they get
  // to add/remove freely as a personal tracking aid until endTurn pushes
  // the list to the server.
  syncFromServer: (session) => set({ session }),

  // Seed the local eliminated set from the server's persisted list. Call
  // this once on board init so a returning player sees their last saved
  // eliminations; don't call it on subsequent syncs or local removals
  // would be clobbered.
  seedMyEliminated: (session) => {
    const { myRole } = get();
    if (!myRole) return;
    const persisted =
      myRole === 'host' ? session.host_eliminated : session.guest_eliminated;
    set({ myEliminated: [...persisted] });
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
