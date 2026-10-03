# Patterned rug texture (cream field, terracotta/navy/olive borders, central medallion) -> rug_persian.png
from PIL import Image, ImageDraw
import math
W,H=1024,724
im=Image.new('RGB',(W,H),'#efe3cf'); d=ImageDraw.Draw(im)
def border(i,w,col): d.rectangle([i,i,W-1-i,H-1-i],outline=col,width=w)
border(0,34,'#a8532f'); border(34,10,'#f3e9d6'); border(44,22,'#27375a'); border(66,8,'#f3e9d6'); border(74,14,'#6b7240')
# field motifs: small diamonds on a grid
for gx in range(130,W-130,64):
    for gy in range(130,H-130,64):
        r=11; d.polygon([(gx,gy-r),(gx+r,gy),(gx,gy+r),(gx-r,gy)],fill='#d9c3a5')
# medallion
cx,cy=W//2,H//2
for k,(rx,ry,col) in enumerate([(250,170,'#a8532f'),(215,140,'#efe3cf'),(190,122,'#27375a'),(150,92,'#d9a24a'),(110,64,'#a8532f'),(60,34,'#efe3cf')]):
    d.ellipse([cx-rx,cy-ry,cx+rx,cy+ry],fill=col)
for a in range(0,360,30):
    x=cx+int(205*math.cos(math.radians(a))); y=cy+int(130*math.sin(math.radians(a))); d.polygon([(x,y-14),(x+14,y),(x,y+14),(x-14,y)],fill='#efe3cf')
im.save('rug_persian.png')
