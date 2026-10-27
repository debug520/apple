from pathlib import Path
from PIL import Image, ImageOps
photos=list((Path(__file__).parent/'dist'/'expanded-photos').glob('*.jpg'))
before=sum(p.stat().st_size for p in photos)
for p in photos:
    with Image.open(p) as src:
        image=ImageOps.exif_transpose(src).convert('RGB')
        image.thumbnail((800,600))
        image.save(p,'JPEG',quality=72,optimize=True)
print(f'Optimized {len(photos)} photos: {before} -> {sum(p.stat().st_size for p in photos)} bytes')
