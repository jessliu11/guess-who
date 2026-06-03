import { abandonSession } from './session';
import { supabase } from './supabase';

jest.mock('./supabase', () => {
  const eq = jest.fn();
  const update = jest.fn(() => ({ eq }));
  const from = jest.fn(() => ({ update }));
  return {
    supabase: { from },
    __mocks: { from, update, eq },
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { __mocks: mocks } = require('./supabase') as {
  supabase: typeof supabase;
  __mocks: { from: jest.Mock; update: jest.Mock; eq: jest.Mock };
};

beforeEach(() => {
  mocks.from.mockClear();
  mocks.update.mockClear();
  mocks.eq.mockClear();
  mocks.eq.mockResolvedValue({ error: null });
});

describe('abandonSession', () => {
  it('updates the game_sessions row with status=abandoned', async () => {
    await abandonSession('session-1');

    expect(mocks.from).toHaveBeenCalledWith('game_sessions');
    expect(mocks.update).toHaveBeenCalledWith({ status: 'abandoned' });
    expect(mocks.eq).toHaveBeenCalledWith('id', 'session-1');
  });

  it('targets the specific session id passed in', async () => {
    await abandonSession('another-session');
    expect(mocks.eq).toHaveBeenCalledWith('id', 'another-session');
  });

  it('resolves without throwing when the update succeeds', async () => {
    await expect(abandonSession('session-1')).resolves.toBeUndefined();
  });
});
