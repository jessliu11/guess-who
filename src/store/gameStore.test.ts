import { useGameStore } from './gameStore';
import type { GameSession } from '../types/game.types';

function makeSession(overrides: Partial<GameSession> = {}): GameSession {
  return {
    id: 'session-1',
    join_code: 'ABC123',
    host_id: 'host-user',
    guest_id: 'guest-user',
    pack_id: 'pack-1',
    status: 'active',
    host_character_id: 'char-host',
    guest_character_id: 'char-guest',
    current_turn: 'host',
    character_pool: ['a', 'b', 'c', 'd'],
    host_eliminated: [],
    guest_eliminated: [],
    turn_count: 0,
    created_at: '2026-06-03T00:00:00Z',
    updated_at: '2026-06-03T00:00:00Z',
    expires_at: '2026-06-03T02:00:00Z',
    ...overrides,
  };
}

beforeEach(() => {
  useGameStore.getState().clearGame();
});

describe('eliminateLocally', () => {
  it('adds the id when it is not already eliminated', () => {
    useGameStore.getState().eliminateLocally('a');
    expect(useGameStore.getState().myEliminated).toEqual(['a']);
  });

  it('removes the id when it is already eliminated (toggle off)', () => {
    useGameStore.getState().eliminateLocally('a');
    useGameStore.getState().eliminateLocally('a');
    expect(useGameStore.getState().myEliminated).toEqual([]);
  });

  it('toggles each id independently', () => {
    useGameStore.getState().eliminateLocally('a');
    useGameStore.getState().eliminateLocally('b');
    useGameStore.getState().eliminateLocally('a');
    expect(useGameStore.getState().myEliminated).toEqual(['b']);
  });
});

describe('syncFromServer', () => {
  it('updates the session', () => {
    const next = makeSession({ turn_count: 4, current_turn: 'guest' });
    useGameStore.getState().syncFromServer(next);
    expect(useGameStore.getState().session).toEqual(next);
  });

  it('does NOT touch myEliminated even when the server list differs from local', () => {
    // Regression: previously the store merged server + local as a union,
    // so a locally un-eliminated character would re-appear after sync.
    useGameStore.setState({ myRole: 'host', myEliminated: ['b'] });
    const serverSession = makeSession({ host_eliminated: ['a', 'b'] });
    useGameStore.getState().syncFromServer(serverSession);
    expect(useGameStore.getState().myEliminated).toEqual(['b']);
  });
});

describe('syncFromServer with abandoned status', () => {
  it('reflects the abandoned status in the store so screens can react', () => {
    useGameStore.getState().syncFromServer(makeSession({ status: 'active' }));
    expect(useGameStore.getState().session?.status).toBe('active');

    useGameStore.getState().syncFromServer(makeSession({ status: 'abandoned' }));
    expect(useGameStore.getState().session?.status).toBe('abandoned');
  });

  it('preserves local eliminations when the session is abandoned', () => {
    useGameStore.setState({ myRole: 'host', myEliminated: ['a', 'b'] });
    useGameStore.getState().syncFromServer(makeSession({ status: 'abandoned' }));
    expect(useGameStore.getState().myEliminated).toEqual(['a', 'b']);
  });
});

describe('seedMyEliminated', () => {
  it('seeds from host_eliminated when role is host', () => {
    useGameStore.getState().setMyRole('host');
    useGameStore
      .getState()
      .seedMyEliminated(
        makeSession({ host_eliminated: ['a', 'c'], guest_eliminated: ['z'] }),
      );
    expect(useGameStore.getState().myEliminated).toEqual(['a', 'c']);
  });

  it('seeds from guest_eliminated when role is guest', () => {
    useGameStore.getState().setMyRole('guest');
    useGameStore
      .getState()
      .seedMyEliminated(
        makeSession({ host_eliminated: ['a'], guest_eliminated: ['x', 'y'] }),
      );
    expect(useGameStore.getState().myEliminated).toEqual(['x', 'y']);
  });

  it('is a no-op when role is not yet set', () => {
    useGameStore.setState({ myEliminated: ['keep-me'] });
    useGameStore
      .getState()
      .seedMyEliminated(makeSession({ host_eliminated: ['a'] }));
    expect(useGameStore.getState().myEliminated).toEqual(['keep-me']);
  });
});
