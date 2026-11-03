# Tile screenshots 2x2 into contact sheets. Usage: python tools/sheet.py shots sheets
import sys, os
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
files = sorted(f for f in os.listdir(src) if f.endswith('.png'))
for k in range(0, len(files), 4):
    group = files[k:k+4]
    ims = [Image.open(os.path.join(src, f)).resize((800, 450)) for f in group]
    sheet = Image.new('RGB', (1600, 900), 'white')
    for j, im in enumerate(ims):
        sheet.paste(im, ((j % 2) * 800, (j // 2) * 450))
    sheet.save(os.path.join(dst, f'sheet-{k//4:02d}-{group[0][:-4]}.png'))
print(len(files), 'shots')
