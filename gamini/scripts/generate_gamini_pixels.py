#!/usr/bin/env python3
"""
Gamini Pixel Art Generator
Generates sample pixel art assets for the 'gamini' directory.
"""

import os
import random
from dataclasses import dataclass
from typing import Callable, Tuple

try:
    from PIL import Image
except ImportError:
    print("Pillow (PIL) is not installed. Skipping pixel art generation.")
    exit(0)

Rgba = Tuple[int, int, int, int]

@dataclass(frozen=True)
class PixelAsset:
    path: str
    base_size: Tuple[int, int]
    draw: Callable[[Image.Image, random.Random], None]

def _put(img: Image.Image, x: int, y: int, c: Rgba) -> None:
    if 0 <= x < img.width and 0 <= y < img.height:
        img.putpixel((x, y), c)

def _rect(img: Image.Image, x0: int, y0: int, x1: int, y1: int, c: Rgba) -> None:
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            _put(img, x, y, c)

def _line(img: Image.Image, x0: int, y0: int, x1: int, y1: int, c: Rgba) -> None:
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    x, y = x0, y0
    while True:
        _put(img, x, y, c)
        if x == x1 and y == y1: break
        e2 = 2 * err
        if e2 >= dy: err += dy; x += sx
        if e2 <= dx: err += dx; y += sy

def _circle(img: Image.Image, cx: int, cy: int, r: int, c: Rgba, fill: bool = True) -> None:
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            if fill:
                if (x-cx)**2 + (y-cy)**2 <= r**2: _put(img, x, y, c)
            else:
                if r**2 - 2*r <= (x-cx)**2 + (y-cy)**2 <= r**2 + 2*r: _put(img, x, y, c)

def _outline(img: Image.Image, color: Rgba) -> None:
    src = img.copy()
    for y in range(img.height):
        for x in range(img.width):
            if src.getpixel((x, y))[3] == 0:
                for nx, ny in ((x-1,y), (x+1,y), (x,y-1), (x,y+1)):
                    if 0 <= nx < img.width and 0 <= ny < img.height and src.getpixel((nx, ny))[3] != 0:
                        img.putpixel((x, y), color)
                        break

# --- Assets ---

def _draw_gem(img: Image.Image, rng: random.Random) -> None:
    # Purple Gem
    c_base = (150, 50, 250, 255)
    c_light = (200, 100, 255, 255)
    c_dark = (100, 20, 180, 255)
    
    _rect(img, 4, 2, 11, 2, c_light)
    _line(img, 4, 2, 1, 6, c_base)
    _line(img, 11, 2, 14, 6, c_base)
    _line(img, 1, 6, 7, 13, c_base)
    _line(img, 14, 6, 8, 13, c_base)
    
    # Fill
    for y in range(3, 13):
        for x in range(2, 14):
            if img.getpixel((x,y))[3] == 0: # inside
                # rough fill logic
                if 2 <= y <= 6: _put(img, x, y, c_base)
                elif y > 6 and abs(x-8) < (13-y)+1: _put(img, x, y, c_dark)
    
    # Highlight
    _rect(img, 5, 4, 7, 5, c_light)

    _outline(img, (20, 20, 30, 255))

def _draw_drone(img: Image.Image, rng: random.Random) -> None:
    c_body = (200, 200, 220, 255)
    c_eye = (255, 50, 50, 255)
    
    _circle(img, 8, 8, 4, c_body, fill=True)
    _put(img, 8, 8, c_eye) # Eye center
    
    # Wings/Rotors
    _line(img, 2, 4, 6, 8, c_body)
    _line(img, 14, 4, 10, 8, c_body)
    
    # Antenna
    _line(img, 8, 4, 8, 1, (100, 100, 100, 255))
    _put(img, 8, 0, (255, 0, 0, 255))
    
    _outline(img, (10, 10, 15, 255))

def _draw_heart(img: Image.Image, rng: random.Random) -> None:
    c_red = (255, 80, 80, 255)
    c_hi = (255, 150, 150, 255)
    
    _rect(img, 2, 2, 6, 6, c_red)
    _rect(img, 9, 2, 13, 6, c_red)
    _rect(img, 2, 7, 13, 9, c_red)
    _rect(img, 3, 10, 12, 11, c_red)
    _rect(img, 5, 12, 10, 13, c_red)
    _rect(img, 7, 14, 8, 14, c_red)
    
    # Highlight
    _rect(img, 3, 3, 4, 4, c_hi)
    
    _outline(img, (40, 0, 0, 255))

def main():
    out_dir = "gamini/pixel"
    if not os.path.exists(out_dir):
        os.makedirs(out_dir)
        
    assets = [
        PixelAsset("px_item_gem.png", (16, 16), _draw_gem),
        PixelAsset("px_enemy_drone.png", (16, 16), _draw_drone),
        PixelAsset("px_ui_heart.png", (16, 16), _draw_heart),
    ]
    
    rng = random.Random(123)
    scale = 8 # Big chunky pixels
    
    for asset in assets:
        img = Image.new("RGBA", asset.base_size, (0, 0, 0, 0))
        asset.draw(img, rng)
        img = img.resize((asset.base_size[0] * scale, asset.base_size[1] * scale), Image.NEAREST)
        path = os.path.join(out_dir, asset.path)
        img.save(path)
        print(f"Generated {path}")

if __name__ == "__main__":
    main()

