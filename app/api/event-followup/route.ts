import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leadId, name, email, query } = body;

    if (!leadId || !name || !email) {
      return Response.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Store event followup interest in database
    const { error } = await supabase
      .from('event_followups')
      .insert({
        lead_id: leadId,
        name,
        email,
        query: query || null,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Event followup insert error:', error);
      return Response.json(
        { error: 'Failed to save your interest' },
        { status: 500 }
      );
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('Event followup API error:', err);
    return Response.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
