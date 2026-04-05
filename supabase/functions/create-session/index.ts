import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Verify the calling user via their JWT
    const authHeader = req.headers.get('authorization') ?? '';
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { pack_id, character_pool } = await req.json();

    if (!pack_id || !character_pool?.length) {
      return new Response('Bad request: pack_id and character_pool required', { status: 400 });
    }

    // Fetch the pack
    const { data: pack, error: packError } = await supabase
      .from('character_packs')
      .select('id, requires_premium, creator_id, is_system, character_ids')
      .eq('id', pack_id)
      .single();

    if (packError || !pack) {
      return new Response('Pack not found', { status: 404 });
    }

    // Check premium access for premium packs
    if (pack.requires_premium) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single();

      // If it's an extended system pack, host must be premium
      // If it's a custom pack, the creator must be premium (pack already has requires_premium=true)
      if (!profile?.is_premium) {
        return new Response('Premium required for this pack', { status: 403 });
      }
    }

    // Generate join code — retry up to 5 times on collision
    let join_code = '';
    const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let attempt = 0; attempt < 5; attempt++) {
      join_code = Array.from(
        { length: 6 },
        () => CHARS[Math.floor(Math.random() * CHARS.length)],
      ).join('');

      const { data: existing } = await supabase
        .from('game_sessions')
        .select('id')
        .eq('join_code', join_code)
        .eq('status', 'waiting')
        .maybeSingle();

      if (!existing) break;
    }

    const { data: session, error: insertError } = await supabase
      .from('game_sessions')
      .insert({
        join_code,
        host_id: user.id,
        pack_id,
        character_pool,
        status: 'waiting',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify(session), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('create-session error:', err);
    return new Response('Internal error', { status: 500 });
  }
});
