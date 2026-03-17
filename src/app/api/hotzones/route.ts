import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = req.nextUrl.searchParams;
    const audioId = searchParams.get('audio_id');

    let query = supabase.from('hotzones').select('*');

    if (audioId) {
      query = query.eq('audio_id', audioId);
    }

    const { data, error } = await query.order('start_time', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Pull transcript_words from metadata for compatibility
    const hotzones = (data || []).map((hz: any) => {
      if (hz.metadata?.transcript_words) {
        return { ...hz, transcript_words: hz.metadata.transcript_words };
      }
      return hz;
    });

    return NextResponse.json(hotzones);
  } catch (error: any) {
    console.error('Hotzones GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await createClient();

    // Move transcript_words to metadata for schema compatibility
    const payload = { ...body };
    if (payload.transcript_words) {
      payload.metadata = {
        ...payload.metadata,
        transcript_words: payload.transcript_words,
      };
      delete payload.transcript_words;
    }

    const { data, error } = await supabase
      .from('hotzones')
      .insert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Hotzones POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await createClient();

    // Move transcript_words to metadata for schema compatibility
    const payload = { ...body };
    if (payload.transcript_words) {
      payload.metadata = {
        ...payload.metadata,
        transcript_words: payload.transcript_words,
      };
      delete payload.transcript_words;
    }

    const { data, error } = await supabase
      .from('hotzones')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Hotzones PUT error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await createClient();

    // Get current user for authorization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    // Move transcript_words to metadata for schema compatibility
    const payload = { ...updates };
    if (payload.transcript_words) {
      payload.metadata = {
        ...payload.metadata,
        transcript_words: payload.transcript_words,
      };
      delete payload.transcript_words;
    }

    // Ensure user_id is preserved and verify ownership
    const { data: existingHotzone, error: fetchError } = await supabase
      .from('hotzones')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingHotzone) {
      return NextResponse.json({ error: 'Hotzone not found' }, { status: 404 });
    }

    if (existingHotzone.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('hotzones')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[Hotzones PATCH] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[Hotzones PATCH] Updated hotzone:', id);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Hotzones PATCH error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get current user for authorization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership before deleting
    const { data: existingHotzone, error: fetchError } = await supabase
      .from('hotzones')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingHotzone) {
      return NextResponse.json({ error: 'Hotzone not found' }, { status: 404 });
    }

    if (existingHotzone.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
      .from('hotzones')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[Hotzones DELETE] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[Hotzones DELETE] Deleted hotzone:', id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Hotzones DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
