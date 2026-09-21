from PIL import Image
import os

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = os.path.join(root, "public", "brand", "_src-logo.jpg")
img = Image.open(src).convert("RGBA")
pixels = img.load()
w, h = img.size

# Only pure-ish white -> transparent; keep light-gray banner
THRESHOLD = 245
for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        if r >= THRESHOLD and g >= THRESHOLD and b >= THRESHOLD:
            pixels[x, y] = (r, g, b, 0)

bbox = img.getbbox()
if not bbox:
    raise SystemExit("empty after transparency")

pad = 4
l, t, r, b = bbox
l = max(0, l - pad)
t = max(0, t - pad)
r = min(w, r + pad)
b = min(h, b + pad)
cropped = img.crop((l, t, r, b))
print("original", w, h, "cropped", cropped.size, "bbox", bbox)

out_dir = os.path.join(root, "public", "brand")
os.makedirs(out_dir, exist_ok=True)

for name in ("logo.png", "logo-dark.png", "logo-full.png"):
    path = os.path.join(out_dir, name)
    cropped.save(path, "PNG", optimize=True)
    print("wrote", path, os.path.getsize(path))

# Footer / dark-bg variant: lift near-black text to white, keep chroma
light = cropped.copy()
lp = light.load()
lw, lh = light.size
for y in range(lh):
    for x in range(lw):
        r, g, b, a = lp[x, y]
        if a == 0:
            continue
        mx, mn = max(r, g, b), min(r, g, b)
        chroma = mx - mn
        if chroma < 28 and mx < 90:
            lp[x, y] = (255, 255, 255, a)
        elif chroma < 28 and 90 <= mx <= 210:
            v = min(255, int(mx + (255 - mx) * 0.55))
            lp[x, y] = (v, v, v, a)

light_path = os.path.join(out_dir, "logo-light.png")
light.save(light_path, "PNG", optimize=True)
print("wrote", light_path, os.path.getsize(light_path))

cw, ch = cropped.size
side = max(cw, ch)
sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
sq.paste(cropped, ((side - cw) // 2, (side - ch) // 2), cropped)
fav = sq.resize((192, 192), Image.Resampling.LANCZOS)
fav_path = os.path.join(out_dir, "favicon.png")
fav.save(fav_path, "PNG", optimize=True)
print("wrote", fav_path, fav.size)
print("done")
