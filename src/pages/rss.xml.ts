import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getPosts } from '../lib/posts';
import { site } from '../data/site';
import { contentPath } from '../i18n/content';

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  return rss({
    title: `${site.name} — Blog`,
    description: site.description,
    site: site.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: contentPath('blog', post.id),
      categories: post.data.tags,
    })),
    customData: '<language>en-us</language>',
  });
};
