import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { newsCache } from '@/lib/news-cache';

export async function POST(request: NextRequest) {
    console.log('[News API] Iniciando petición robusta...');
    
    try {
        const body = await request.json();
        const { category, limit = 5 } = body;

        // 1. Gestión de Cache
        const cacheKey = `news:${category || 'all'}:${limit}`;
        const cached = newsCache.get(cacheKey);
        if (cached) {
            console.log('[News API] Usando datos de cache:', cacheKey);
            return NextResponse.json({ ...cached, cached: true });
        }

        const domain = 'https://orain.eus';
        const baseUrl = 'https://orain.eus/es';
        const validCategories = ['politica', 'economia', 'sociedad', 'cultura'];
        const selectedCategory = validCategories.includes(category) ? category : '';
        const url = selectedCategory ? `${baseUrl}/${selectedCategory}` : baseUrl;

        // 2. Fetch de la Portada
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            },
        });

        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Selectores robustos para encontrar artículos
        const articleSelectors = ['article', '.noticia', '.news-item', '.card-noticia', '.c-article'];
        let elements: any[] = [];
        for (const sel of articleSelectors) {
            if (elements.length === 0) elements = $(sel).toArray();
        }

        console.log(`[News API] Procesando ${elements.length} noticias en paralelo...`);

        // 3. Procesamiento en Paralelo de Metadatos (La "Previa")
        const news = await Promise.all(
            elements.slice(0, limit).map(async (el) => {
                const $el = $(el);
                const titleFromList = $el.find('h2, h3, .titulo').first().text().trim();
                const rawLink = $el.find('a').first().attr('href');

                // Limpieza robusta de URL
                let cleanUrl = '';
                if (rawLink) {
                    if (rawLink.startsWith('http')) {
                        cleanUrl = rawLink;
                    } else {
                        const path = rawLink.startsWith('/') ? rawLink : `/${rawLink}`;
                        cleanUrl = path.startsWith('/es') ? `${domain}${path}` : `${domain}/es${path}`;
                    }
                }

                let metadata = {
                    title: titleFromList || 'Sin título',
                    description: $el.find('p, .sumario').first().text().trim(),
                    image: null as string | null
                };

                // Fetch de Metadatos OG (Solo el <head>)
                if (cleanUrl && cleanUrl.includes('orain.eus')) {
                    try {
                        const detailRes = await fetch(cleanUrl, { 
                            signal: AbortSignal.timeout(2500),
                            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EITBBot/1.0)' }
                        });
                        
                        if (detailRes.ok) {
                            const detailHtml = await detailRes.text();
                            const $meta = cheerio.load(detailHtml);
                            
                            metadata.title = $meta('meta[property="og:title"]').attr('content') || metadata.title;
                            metadata.description = $meta('meta[property="og:description"]').attr('content') || 
                                                  $meta('meta[name="description"]').attr('content') || 
                                                  metadata.description;
                            metadata.image = $meta('meta[property="og:image"]').attr('content') || null;
                        }
                    } catch (e) {
                        console.warn(`[News API] Error en metadatos para ${cleanUrl}`);
                    }
                }

                return {
                    title: metadata.title,
                    summary: metadata.description || 'Resumen no disponible',
                    fullContent: metadata.description, // Enviado al Agente
                    url: cleanUrl,
                    image: metadata.image,
                    source: 'Orain.eus',
                    scrapedAt: new Date().toISOString()
                };
            })
        );

        const result = { success: true, news: news.filter(n => n.title), source: url };
        newsCache.set(cacheKey, result);
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('[News API] Error:', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const category = request.nextUrl.searchParams.get('category') || '';
    return POST(new NextRequest(request.url, { method: 'POST', body: JSON.stringify({ category, limit: 5 }) }));
}