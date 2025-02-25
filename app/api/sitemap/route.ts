import { NextResponse } from 'next/server';

// List of common words for etymology searches
const popularWords = [
  'love', 'time', 'day', 'life', 'world', 'heart', 'mind', 'soul', 'friend',
  'family', 'home', 'work', 'money', 'food', 'water', 'earth', 'fire', 'air',
  'language', 'word', 'book', 'story', 'history', 'science', 'art', 'music',
  'philosophy', 'religion', 'god', 'human', 'man', 'woman', 'child', 'people',
  'nature', 'animal', 'plant', 'tree', 'flower', 'sun', 'moon', 'star', 'sky',
  'ocean', 'river', 'mountain', 'city', 'country', 'nation', 'war', 'peace'
];

export async function GET() {
  const baseUrl = 'https://etymon.rumiallbert.com';
  const today = new Date().toISOString().split('T')[0];
  
  // Create XML sitemap with homepage and popular words
  let urlEntries = `
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`;
  
  // Add popular words to sitemap
  popularWords.forEach(word => {
    urlEntries += `
  <url>
    <loc>${baseUrl}/word/${encodeURIComponent(word)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
} 