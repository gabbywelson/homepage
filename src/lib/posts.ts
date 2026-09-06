import { getCollection } from 'astro:content';

export async function getPosts({ includeSamples = false } = {}) {
  return (await getCollection('blog', ({ data }) =>
    !data.draft && data.pubDate <= new Date() && (includeSamples || !data.sample)
  )).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date);
}
