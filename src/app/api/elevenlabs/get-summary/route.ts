// app/api/elevenlabs/get-summary/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get('conversationId');
        const apiKey = process.env.ELEVENLABS_API_KEY;

        if (!conversationId) {
            return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
        }

        if (!apiKey) {
            return NextResponse.json({ error: 'Missing API key' }, { status: 500 });
        }

        console.log(`[get-summary] Fetching details for: ${conversationId}`);

        const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`, {
            method: 'GET',
            headers: {
                'xi-api-key': apiKey
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[get-summary] ElevenLabs API error: ${response.status}`, errorText);
            return NextResponse.json({ error: 'Failed to fetch conversation data', details: errorText }, { status: response.status });
        }

        const data = await response.json();

        // El resumen está en data.analysis.summary
        const summary = data.analysis?.summary || 'El resumen aún no está disponible o no se generó.';

        return NextResponse.json({
            conversation_id: data.conversation_id,
            summary: summary,
            status: data.status,
            analysis: data.analysis
        });

    } catch (error: any) {
        console.error('[get-summary] Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}
