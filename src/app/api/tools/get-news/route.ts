import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
  try {
    const { category, limit = 5 } = await request.json();
    const domain = 'https://orain.eus';
    const path = category ? `/es/${category.toLowerCase()}` : '/es';
    const url = `${domain}${path}`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
    });

    const html = await response.text();
    const $ = cheerio.load(html);
    const elements = $('article, .noticia').toArray().slice(0, limit);

    const news = await Promise.all(elements.map(async (el) => {
      const $el = $(el);
      const link = $el.find('a').first().attr('href');
      const cleanUrl = link?.startsWith('http') ? link : `${domain}${link}`;

      let data = {
        title: $el.find('h2, h3').first().text().trim() || "Noticia EITB",
        image: null as string | null,
        url: cleanUrl,
        summary: $el.find('p, .sumario').first().text().trim()
      };

      // Obtención rápida de la imagen og:image de la noticia
      try {
        const detailRes = await fetch(cleanUrl, { signal: AbortSignal.timeout(2000) });
        const detailHtml = await detailRes.text();
        const $m = cheerio.load(detailHtml);
        data.image = $m('meta[property="og:image"]').attr('content') || null;
        data.summary = $m('meta[property="og:description"]').attr('content') || data.summary;
      } catch (e) {
        console.error("Error cargando metadatos para:", cleanUrl);
      }

      return data;
    }));

    return NextResponse.json({ success: true, news: news.filter(n => n.title) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}