import { satteri } from '@astrojs/markdown-satteri';
import { localizeMarkdownLink } from '../i18n/links';

/** Keep generated image candidates aligned with the prose column, not the viewport. */
export const markdownProcessor = satteri({
  hastPlugins: [
    {
      name: 'localized-content-links',
      element: {
        filter: ['a'],
        visit(node, context) {
          const href = node.properties['href'];
          if (typeof href !== 'string') return;
          const link = localizeMarkdownLink(href, context.fileURL);
          context.setProperty(node, 'href', link.href);
          if (link.hreflang)
            context.setProperty(node, 'hreflang', link.hreflang);
        },
      },
    },
    {
      name: 'content-image-sizes',
      element: {
        filter: ['img'],
        visit(node, context) {
          // Content explicitly opts in only its measured above-fold LCP image.
          const priority =
            typeof node.properties['src'] === 'string' &&
            node.properties['src'] ===
              context.data.astro?.frontmatter['priorityImage'];
          if (priority) {
            context.setProperty(node, 'loading', 'eager');
            context.setProperty(node, 'fetchpriority', 'high');
          }
          if (node.properties['sizes']) return;

          // Native auto sizing is exact for lazy images, including smaller originals.
          // The fallback matches BaseLayout's 624px main width and mobile padding.
          context.setProperty(
            node,
            'sizes',
            `${priority ? '' : 'auto, '}(max-width: 370px) calc(100vw - 38px), (max-width: 600px) calc(100vw - 48px), (max-width: 688px) calc(100vw - 64px), 624px`,
          );
        },
      },
    },
  ],
});
