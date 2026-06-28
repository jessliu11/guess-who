import { abandonSession } from './session';
import { supabase } from './supabase';

jest.mock('./supabase', () => {
  const rpc = jest.fn();
  return {
    supabase: { rpc },
    __mocks: { rpc },
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { __mocks: mocks } = require('./supabase') as {
  supabase: typeof supabase;
  __mocks: { rpc: jest.Mock };
};

beforeEach(() => {
  mocks.rpc.mockClear();
  mocks.rpc.mockResolvedValue({ error: null });
});

describe('abandonSession', () => {
  it('calls the abandon_session RPC with the session id', async () => {
    await abandonSession('session-1');

    expect(mocks.rpc).toHaveBeenCalledWith('abandon_session', { p_session_id: 'session-1' });
  });

  it('targets the specific session id passed in', async () => {
    await abandonSession('another-session');
    expect(mocks.rpc).toHaveBeenCalledWith('abandon_session', { p_session_id: 'another-session' });
  });

  it('resolves without throwing when the RPC succeeds', async () => {
    await expect(abandonSession('session-1')).resolves.toBeUndefined();
  });

  it('throws when the RPC returns an error', async () => {
    mocks.rpc.mockResolvedValue({ error: new Error('rpc failed') });
    await expect(abandonSession('session-1')).rejects.toThrow('rpc failed');
  });
});
