"""Regenerate the WebP twins the app imports from the supplied PNG artwork.

The PNGs in src/assets/cycle-tracker/girl/ are the source of truth and are never modified. This writes
a same-basename .webp beside each one, with the long edge capped at 1200px (the panel never renders the
character wider than ~600 CSS px, so this is already retina-sharp).

Run after adding or replacing any PNG:    python scripts/optimize-girl-assets.py
"""

import glob
import os

from PIL import Image

GIRL_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "assets", "cycle-tracker", "girl")
MAX_EDGE = 1200
QUALITY = 82


def main() -> None:
    total_png = total_webp = 0
    for png in sorted(glob.glob(os.path.join(GIRL_DIR, "*.png"))):
        image = Image.open(png).convert("RGBA")
        image.thumbnail((MAX_EDGE, MAX_EDGE), Image.LANCZOS)
        webp = os.path.splitext(png)[0] + ".webp"
        image.save(webp, "WEBP", quality=QUALITY, method=6)
        total_png += os.path.getsize(png)
        total_webp += os.path.getsize(webp)
        print(f"{os.path.basename(png):45s} -> {os.path.basename(webp)}  {os.path.getsize(webp) // 1024} KB")
    print(f"\nTotal: {total_png // 1024 // 1024} MB of PNG -> {total_webp // 1024} KB of WebP")


if __name__ == "__main__":
    main()
