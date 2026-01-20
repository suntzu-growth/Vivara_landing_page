import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { newsCache } from '@/lib/news-cache';

export async function POST(request: NextRequest) {
    console.log('[News API] Starting request...');
    
    try {
        const body = await request.json();
        const { category, limit = 5 } = body;

        const cacheKey = `news:${category || 'all'}:${limit}`;
        const cached = newsCache.get(cacheKey);

        if (cached) {
            console.log('[News API] Returning cached results for:', cacheKey);
            return NextResponse.json({ ...cached, cached: true });
        }

        const domain = 'https://orain.eus';
        const baseUrl = 'https://orain.eus/es';
        
        const validCategories = ['politica', 'economia', 'sociedad', 'cultura'];
        const selectedCategory = validCategories.includes(category) ? category : '';
        const url = selectedCategory ? `${baseUrl}/${selectedCategory}` : baseUrl;

        console.log('[News API] Fetching index from:', url);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; EITBBot/1.0)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.9',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch Orain.eus: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Recuperamos tu diversidad de selectores original
        const selectors = [
            'article',
            '.noticia',
            '.news-item',
            '.card-noticia',
            '.item-noticia',
            '.c-article'
        ];
        
        let articleElements: any[] = [];
        selectors.forEach(selector => {
            if (articleElements.length === 0) {
                articleElements = $(selector).toArray();
            }
        });

        console.log(`[News API] Found ${articleElements.length} elements, processing top ${limit}`);

        // PROCESAMIENTO EN PARALELO PARA DEEP SCRAPING
        const news = await Promise.all(
            articleElements.slice(0, limit).map(async (el, index) => {
                const $article = $(el);
                
                // Extracción de Título con tus múltiples fallbacks
                const title = $article.find('h2, h3, h4, .titulo, .title, .headline').first().text().trim() ||
                              $article.find('a').first().attr('title')?.trim() || 
                              'Sin título';

                const summary = $article.find('p, .sumario, .summary, .descripcion, .lead').first().text().trim();
                const rawLink = $article.find('a').first().attr('href');
                
                // Lógica de limpieza de URL para evitar el error /es/es/
                let cleanUrl = '';
                if (rawLink) {
                    if (rawLink.startsWith('http')) {
                        cleanUrl = rawLink;
                    } else {
                        const path = rawLink.startsWith('/') ? rawLink : `/${rawLink}`;
                        cleanUrl = path.startsWith('/es') ? `${domain}${path}` : `${domain}/es${path}`;
                    }
                }

                // Extracción de Imagen
                const rawImage = $article.find('img').first().attr('src') || 
                                 $article.find('img').first().attr('data-src');
                let cleanImage = null;
                if (rawImage) {
                    cleanImage = rawImage.startsWith('http') ? rawImage : `${domain}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`;
                }

                const date = $article.find('time, .fecha, .date').first().text().trim() || 'Hoy';

                // --- DEEP SCRAPING (Entrando en la noticia) ---
                let fullContent = "";
                if (cleanUrl && cleanUrl.includes('orain.eus')) {
                    try {
                        // Timeout agresivo para no penalizar al usuario
                        const detailRes = await fetch(cleanUrl, { 
                            signal: AbortSignal.timeout(3000),
                            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EITBBot/1.0)' }
                        });
                        
                        if (detailRes.ok) {
                            const detailHtml = await detailRes.text();
                            const $detail = cheerio.load(detailHtml);
                            
                            // Buscamos el cuerpo de la noticia en los selectores comunes de Orain
                            fullContent = $detail('.c-detail__body p, .article-body p, .text-content p, article p')
                                .map((_, p) => $(p).text())
                                .get()
                                .join(' ')
                                .trim()
                                .slice(0, 1000); // Suficiente para el contexto del Agente
                            
                            console.log(`[News API] Deep scraped: ${title.slice(0, 30)}... (${fullContent.length} chars)`);
                        }
                    } catch (e) {
                        console.warn(`[News API] Could not deep scrape ${cleanUrl}:`, e);
                    }
                }

                return {
                    title,
                    summary: summary || 'Resumen no disponible',
                    fullContent: fullContent || summary || 'No se pudo extraer el contenido detallado.',
                    url: cleanUrl,
                    image: cleanImage,
                    publishedAt: date,
                    source: 'Orain.eus',
                    category: selectedCategory || 'general'
                };
            })
        );

        const result = {
            success: true,
            count: news.length,
            news: news.filter(item => item.title !== 'Sin título'),
            scrapedAt: new Date().toISOString(),
            source: url
        };

        newsCache.set(cacheKey, result);
        console.log(`[News API] Completed. Returning ${news.length} items.`);
        
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('[News API] Fatal Error:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Internal Server Error', 
            details: error.message 
        }, { status: 500 });
    }
}

// Handler para GET (para pruebas rápidas en navegador)
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || '';
    return POST(new NextRequest(request.url, {
        method: 'POST',
        body: JSON.stringify({ category, limit: 5 })
    }));
}