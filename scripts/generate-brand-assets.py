"""Builds the launcher icon and the adaptive-icon background.

The gold logo on plain white, flat — no gradient, no glow. White on purpose: the
main Decent Tailor app's icon is the same logo on near-black, and a shop's phone
has both, so this one has to be told apart at a glance.

    python3 scripts/generate-brand-assets.py

Writes assets/brand/app-icon.png (logo on the ground) and
assets/brand/adaptive-background.png (the ground alone, for Android's adaptive
icon, which puts adaptive-foreground.png on top). Keep ICON_GROUND in step with
adaptiveIcon.backgroundColor in app.json.
"""
from pathlib import Path

from PIL import Image

SIZE = 1024
ICON_GROUND = (255, 255, 255)  # #FFFFFF

BRAND = Path(__file__).resolve().parent.parent / "assets" / "brand"


def main() -> None:
    background = Image.new("RGB", (SIZE, SIZE), ICON_GROUND)
    background.save(BRAND / "adaptive-background.png", optimize=True)

    # The logo about two thirds of the width, centred a hair above the middle.
    logo = Image.open(BRAND / "logo-gold.png").convert("RGBA")
    width = 676
    logo = logo.resize((width, round(width * logo.height / logo.width)), Image.LANCZOS)
    icon = background.convert("RGBA")
    icon.alpha_composite(
        logo, ((SIZE - logo.width) // 2, (SIZE - logo.height) // 2 - 1)
    )
    icon.convert("RGB").save(BRAND / "app-icon.png", optimize=True)
    print("icon ground:", "#%02X%02X%02X" % ICON_GROUND)


if __name__ == "__main__":
    main()
