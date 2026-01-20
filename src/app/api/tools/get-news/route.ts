import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { category, limit = 5 } = body;
        
        const domain = 'https://orain.eus';
        const baseUrl = 'https://orain.eus/es';
        const url = category ? `${baseUrl}/${category.toLowerCase()}` : baseUrl;

        console.log(`[API News] Solicitando: ${url}`);

        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
            next: { revalidate: 3600 } 
        });

        const html = await response.text();
        const $ = cheerio.load(html);
        const elements = $('article, .noticia, .news-item').toArray().slice(0, limit);

        const news = await Promise.all(elements.map(async (el) => {
            const $el = $(el);
            const rawLink = $el.find('a').first().attr('href');
            
            // Normalización de URL
            let cleanUrl = '';
            if (rawLink) {
                if (rawLink.startsWith('http')) cleanUrl = rawLink;
                else cleanUrl = `${domain}${rawLink.startsWith('/') ? '' : '/'}${rawLink}`;
            }

            let item = {
                title: $el.find('h2, h3').first().text().trim() || 'Noticia Orain.eus',
                summary: $el.find('p, .sumario').first().text().trim(),
                image: null as string | null,
                url: cleanUrl,
                source: 'Orain.eus'
            };

            // Extracción de metadatos (Previa visual)
            if (cleanUrl && cleanUrl.includes('orain.eus')) {
                try {
                    const detailRes = await fetch(cleanUrl, { signal: AbortSignal.timeout(3000) });
                    const detailHtml = await detailRes.text();
                    const $meta = cheerio.load(detailHtml);
                    
                    item.image = $meta('meta[property="og:image"]').attr('content') || null;
                    item.summary = $meta('meta[property="og:description"]').attr('content') || item.summary;
                } catch (e) {
                    console.error(`[API News] Falló metadatos para: ${cleanUrl}`);
                }
            }
            return item;
        }));

        return NextResponse.json({ success: true, news: news.filter(n => n.url) });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}