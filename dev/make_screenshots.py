"""Render the README screenshot with a headless Chrome or Edge.

Usage (from the repository root):

    python -m http.server 8765 --bind 127.0.0.1
    python dev/make_screenshots.py

Writes docs/screenshots/<lang>/card-styles.png, trimmed to the content.
Needs Pillow for trimming.
"""

from __future__ import annotations

import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageChops

BASE_URL = "http://127.0.0.1:8765/dev/preview.html?bare&state=smoke"
OUT = Path(__file__).resolve().parent.parent / "docs" / "screenshots"
BROWSERS = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "google-chrome",
    "chromium",
]


def browser() -> str:
    for candidate in BROWSERS:
        if Path(candidate).exists() or shutil.which(candidate):
            return candidate
    raise SystemExit("No Chrome or Edge found")


def trim(path: Path, margin: int = 24) -> None:
    image = Image.open(path).convert("RGB")
    background = Image.new("RGB", image.size, image.getpixel((0, 0)))
    box = ImageChops.difference(image, background).getbbox()
    if box:
        left, top, right, bottom = box
        image = image.crop((max(left - margin, 0), max(top - margin, 0),
                            min(right + margin, image.width), min(bottom + margin, image.height)))
    image.save(path)


def main() -> None:
    exe = browser()
    for lang in ("de", "en"):
        target = OUT / lang / "card-styles.png"
        target.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory() as profile:
            subprocess.run([
                exe, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--user-data-dir={profile}",
                "--force-device-scale-factor=2", "--window-size=1100,420", "--virtual-time-budget=1500",
                f"--screenshot={target}", f"{BASE_URL}&lang={lang}",
            ], check=True, capture_output=True)
        trim(target)
        print(target)


if __name__ == "__main__":
    main()
