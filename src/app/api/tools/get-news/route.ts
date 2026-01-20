import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
  try {
    const { category, limit = 5 } = await request.json();
    const domain = 'https://orain.eus';
    const url = category ? `${domain}/es/${category.toLowerCase()}` : `${domain}/es`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const html = await response.text();
    const $ = cheerio.load(html);
    const elements = $('article, .noticia').toArray().slice(0, limit);

    const news = await Promise.all(elements.map(async (el) => {
      const $el = $(el);
      const link = $el.find('a').first().attr('href');
      const cleanUrl = link?.startsWith('http') ? link : `${domain}${link}`;

      let item = {
        title: $el.find('h2, h3').first().text().trim(),
        image: null as string | null,
        url: cleanUrl,
        summary: ""
      };

      if (cleanUrl.includes('orain.eus')) {
        try {
          const res = await fetch(cleanUrl);
          const detailHtml = await res.text();
          const $m = cheerio.load(detailHtml);
          item.image = $m('meta[property="og:image"]').attr('content') || null;
          item.summary = $m('meta[property="og:description"]').attr('content') || "";
        } catch (e) { console.log("Error metadata"); }
      }
      return item;
    }));

    return NextResponse.json({ success: true, news });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}