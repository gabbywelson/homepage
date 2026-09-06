import type { APIRoute } from 'astro';
import { site } from '../data/site';

export const GET: APIRoute = () => {
  return new Response(
    `User-agent: *\n${site.indexable ? 'Allow: /' : 'Disallow: /'}\n\nSitemap: ${site.url}/sitemap-index.xml\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
};
