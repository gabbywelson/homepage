# Inline brand logos

The four supplied source assets are 256 × 256 PNGs. `BrandLogo.astro` renders them as 24px inline rounded squares or 36px list badges and uses Astro's build-time image pipeline to serve small WebP files, with 2× and 3× variants for high-density displays. The adjacent company or school names provide accessible text; the images have empty alt text.

Williams College and Handshake use Gabby's supplied artwork, downscaled for the project. Hack Reactor and LinkedIn were cleaned using the built-in image editor and then downscaled. Original files in Downloads were left unchanged. Rounded corners and badge backgrounds are presentation styles shared by the component, so they stay consistent across the four assets.

## Saved assets

- `williams-college.png`
- `handshake.png`
- `hack-reactor.png`
- `linkedin.png`
- `exeter-college.png` — 250 × 315 PNG rendition of [Exeter College Oxford Coat Of Arms](https://commons.wikimedia.org/wiki/File:Exeter_College_Oxford_Coat_Of_Arms.svg) by ChevronTango, licensed [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Retrieved September 5, 2026. Its proportions are preserved inside the square badge; generated WebP renditions remain CC BY-SA 3.0. Attribution is also included on the public colophon.

## Cleanup prompts

### Hack Reactor

Edit the supplied Hack Reactor logo asset for use as a tiny inline website logo. Precisely isolate the existing circular black-and-blue symbol from the upper part of the image. Remove all text underneath it, including HACK REACTOR, BY GALVANIZE, and TM. Keep the symbol's exact geometry, proportions, black and blue colors, and clean flat edges unchanged. Center this symbol on a plain white square canvas, with even padding of about 10% on every side. The symbol should occupy about 80% of the square. Output one flat square logo asset, no perspective, no texture, no shadow, no additional border or lettering. Preserve the original artwork; this is crop/cleanup and uniform framing.

### LinkedIn

Edit the supplied LinkedIn logo asset for use as a tiny inline website logo. Crop away the registration symbol at the lower right, keeping only the blue square with the white in logo. Preserve the exact original white lettering, dot, blue color, proportions, and geometry without redesigning anything. Fill a square canvas edge-to-edge with the original blue tile, preserving the existing small rounded corners and transparent corner pixels. No external padding, no registration symbol, no added text, no shadows, no texture, no perspective. Output one clean square logo asset.
