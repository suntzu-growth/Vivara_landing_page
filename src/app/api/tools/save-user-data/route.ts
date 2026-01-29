// app/api/tools/save-user-data/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, conversation_id } = body;

        if (!name || !email) {
            return NextResponse.json({
                success: false,
                error: 'Missing name or email'
            }, { status: 400 });
        }

        // 🚀 ENVÍO A GOOGLE SHEETS REAL (si la URL está configurada)
        const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
        let sheetSaved = false;

        console.log('\n' + '='.repeat(50));
        console.log('🚀 [LEAD CAPTURE] PROCESANDO');
        console.log('------------------------------------------');
        console.log(`👤 Nombre: ${name}`);
        console.log(`📧 Email:  ${email}`);
        console.log(`🆔 ConvID: ${conversation_id || 'N/A'}`);
        console.log(`📅 Fecha:  ${new Date().toLocaleString()}`);
        console.log('='.repeat(50) + '\n');

        if (webhookUrl) {
            try {
                console.log(`[save_user_data] Enviando a Google Sheets: ${webhookUrl}`);
                const sheetRes = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name,
                        email,
                        conversation_id,
                        timestamp: new Date().toISOString()
                    }),
                });

                if (sheetRes.ok) {
                    console.log('✅ [SHEET SUCCESS] Datos guardados en el Sheet real');
                    sheetSaved = true;
                } else {
                    console.warn('⚠️ [SHEET WARNING] El webhook respondió con error:', sheetRes.status);
                }
            } catch (e: any) {
                console.error('❌ [SHEET ERROR] Error conectando con el webhook:', e.message);
            }
        } else {
            console.log('ℹ️ [SHEET INFO] No hay GOOGLE_SHEET_WEBHOOK_URL configurada. Solo modo simulación.');
        }

        // Simulamos un retraso de red
        await new Promise(resolve => setTimeout(resolve, 800));

        return NextResponse.json({
            success: true,
            message: sheetSaved ? 'Data saved to Google Sheet' : 'Data saved (simulation mode)',
            real_sheet: sheetSaved,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[save_user_data] Error:', error.message);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
