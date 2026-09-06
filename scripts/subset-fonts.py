"""Rebuild the checked-in Maple Mono web subset with fonttools[woff] 4.59.2."""

from pathlib import Path

from fontTools import subset

ROOT = Path(__file__).resolve().parents[1]
FONTS = ROOT / "src/assets/fonts"

# Latin, extended Latin, combining accents, punctuation, currency, common arrows.
# Keep the variable weight axis and normal shaping/ligatures; the site does not
# enable stylistic sets or character variants. Let the fallback stack supply
# scripts and specialist symbols that this English-language site omits.
UNICODES = (
    "U+0000-036F,U+1E00-1EFF,U+2000-206F,U+20A0-20CF,"
    "U+2103,U+2109,U+2113,U+2116,U+2122,U+212E,U+2190-2199,"
    "U+2212,U+2215,U+FEFF,U+FFFD"
)

subset.main(
    [
        str(FONTS / "source/maple-mono.woff2"),
        f"--output-file={FONTS / 'maple-mono-latin.woff2'}",
        f"--unicodes={UNICODES}",
        "--flavor=woff2",
        "--layout-features=calt,ccmp,clig,liga,kern,locl,mark,mkmk,rlig",
        "--notdef-glyph",
        "--notdef-outline",
        "--recommended-glyphs",
    ]
)
