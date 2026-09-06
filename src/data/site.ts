/** Identity and public links. */
export const site = {
  name: "gabby welson",
  title: "gabby welson",
  description:
    "my personal corner of the web for writing, making things, and following little curiosities.",
  url: "https://welson.net",
  // Enable only for the real production launch.
  indexable: import.meta.env.SITE_INDEXABLE === "true",
  social: [
    { name: "GitHub", href: "https://github.com/gabbywelson", icon: "github" },
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/in/gabbywelson/",
      icon: "linkedin",
    },
    {
      name: "Bluesky",
      href: "https://bsky.app/profile/gabby.gay",
      icon: "butterfly",
    },
    {
      name: "Mastodon",
      href: "https://tacobelllabs.net/@gabby",
      icon: "mastodon",
    },
    {
      name: "Twitter",
      href: "https://twitter.com/welson",
      icon: "twitter",
    },
  ],
} as const;

export const gardenPages = [
  {
    slug: "now",
    title: "Now",
    description: "What has my attention these days.",
    icon: "sun",
    tone: "gold",
  },
  {
    slug: "uses",
    title: "Uses",
    description: "Tools, everyday things, and little essentials.",
    icon: "desktop",
    tone: "sage",
  },
  {
    slug: "colophon",
    title: "Colophon",
    description: "How this little corner of the web is made.",
    icon: "code",
    tone: "lilac",
  },
] as const;
