import { create } from 'zustand';
import type { Character, CharacterPack, PackPreviewCharacter } from '../types/game.types';

export type PackWithPreviews = CharacterPack & { preview_characters: PackPreviewCharacter[] };

interface SetupStore {
  selectedIds: Set<string>;
  /** Cached characters per pack/source ID */
  packCharacters: Record<string, Character[]>;
  myCharacters: Character[];
  packs: PackWithPreviews[];
  toggle: (id: string) => void;
  selectMany: (ids: string[]) => void;
  deselectMany: (ids: string[]) => void;
  setPackCharacters: (sourceId: string, chars: Character[]) => void;
  setMyCharacters: (chars: Character[]) => void;
  setPacks: (packs: PackWithPreviews[]) => void;
  reset: () => void;
}

export const useSetupStore = create<SetupStore>((set) => ({
  selectedIds: new Set<string>(),
  packCharacters: {},
  myCharacters: [],
  packs: [],

  toggle: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),

  selectMany: (ids) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      ids.forEach((id) => next.add(id));
      return { selectedIds: next };
    }),

  deselectMany: (ids) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      ids.forEach((id) => next.delete(id));
      return { selectedIds: next };
    }),

  setPackCharacters: (sourceId, chars) =>
    set((s) => ({
      packCharacters: { ...s.packCharacters, [sourceId]: chars },
    })),

  setMyCharacters: (chars) => set({ myCharacters: chars }),
  setPacks: (packs) => set({ packs }),

  reset: () =>
    set({
      selectedIds: new Set<string>(),
      packCharacters: {},
      myCharacters: [],
      packs: [],
    }),
}));
