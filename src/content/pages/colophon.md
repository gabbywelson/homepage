---
title: Colophon
eyebrow: A peek behind the leaves
description: How this website is made, and a little of its history.
---

## Made to be small

Built with [Astro](https://astro.build/), written in Markdown, and served as static pages. No trackers, no third-party fonts, and no account needed. An [RSS feed](/rss.xml) lets you follow new writing on your own terms.

## Type & little details

Headings are set in [Maple Mono](https://github.com/subframe7536/maple-font), paired with [DM Sans](https://github.com/googlefonts/dm-fonts) for the body. The little icons come from [Phosphor](https://phosphoricons.com/).

The [Exeter College coat of arms](https://commons.wikimedia.org/wiki/File:Exeter_College_Oxford_Coat_Of_Arms.svg) is by ChevronTango, shared under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) and resized for this site.

## A comfortable visit

The site follows your device’s light or dark preference, with a little sun-and-moon dial if you want to change it. Motion takes a rest when your device asks for reduced animation. The words and links work with JavaScript switched off, too.

## Seeds of inspiration

The quiet, personal homepage of [Pedro Marques](https://pedromarques.me/) and the independent-web spirit of [Brennan’s website](https://brennan.day/) helped inspire this space.

## An earlier chapter: the Quartz garden

These notes describe the previous version of the site, preserved from May 2026.

this site is made with [Quartz](https://quartz.jzhao.xyz/), the static site generator tool made by the brilliant [Jacky Zhao](https://jzhao.xyz/). The underlying content is all just an [Obsidian](https://obsidian.md/) vault of markdown files, and I author everything in the site using Obsidian. I did some work in Zed (my current code editor of choice) and Claude Code to do the initial configuration, add some custom style overrides, and similar tasks, but now that the site "works" I can basically just focus on the content.

It is deployed as a Cloudflare worker, which is both fast and free!

To actually publish content, I'm using the _excellent_ [Quartz Syncer](https://github.com/saberzero1/quartz-syncer) plugin, which magically handles all my Git operations and pushes things up to Github when the I make changes in my vault. When there are new commits in the repo, Cloudflare automatically picks them up and deploys them. _Could_ I do all the git stuff myself? Of course! But it's far more pleasant to just stick to Obsidian and let the site deploys just happen on their own
