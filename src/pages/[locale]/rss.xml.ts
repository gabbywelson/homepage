import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getPosts } from '../../lib/posts';
import { site } from '../../data/site';
import { availablePaths, contentPath } from '../../i18n/content';
import { locales, type Locale } from '../../i18n/locales';
import { messages } from '../../i18n/messages';

export async function getStaticPaths() {
  const candidates = await Promise.all(
    locales
      .filter((locale) => locale !== 'en')
      .map(async (locale) => ({ locale, paths: await availablePaths(locale) })),
  );
  return candidates
    .filter(({ paths }) => paths.size)
    .map(({ locale }) => ({
      params: { locale: locale.toLowerCase() },
      props: { locale },
    }));
}

export const GET: APIRoute<{ locale: Locale }> = async ({ props }) => {
  const ui = messages(props.locale);
  return rss({
    title: `${site.name} — ${ui.blog}`,
    description: ui.siteDescription,
    site: site.url,
    items: (await getPosts(props.locale)).map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: contentPath('blog', post.id),
      categories: post.data.tags,
    })),
    customData: `<language>${props.locale}</language>`,
  });
};
