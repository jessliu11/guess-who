import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const WEBHOOK_SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req: Request) => {
  try {
    // Validate webhook authorization header
    const auth = req.headers.get('authorization');
    if (WEBHOOK_SECRET && auth !== WEBHOOK_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const event = body.event as {
      type: string;
      app_user_id: string;
      subscriber_attributes?: Record<string, { value: string }>;
    };

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const isPremiumEvent = [
      'INITIAL_PURCHASE',
      'RENEWAL',
      'UNCANCELLATION',
      'NON_RENEWING_PURCHASE',
    ].includes(event.type);

    const isLostEvent = [
      'EXPIRATION',
      'CANCELLATION',
      'SUBSCRIBER_ALIAS',
    ].includes(event.type);

    // The app_user_id is the Supabase user UUID (set via Purchases.logIn)
    const userId = event.app_user_id;

    if (isPremiumEvent) {
      await supabase
        .from('profiles')
        .update({ is_premium: true, rc_customer_id: userId })
        .eq('id', userId);
    } else if (isLostEvent) {
      await supabase
        .from('profiles')
        .update({ is_premium: false })
        .eq('id', userId);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response('Internal error', { status: 500 });
  }
});
