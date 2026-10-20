"""Copie WebP sans perte de l’ouverture : aucun transfert, original jamais modifié."""
import hashlib
import json
from pathlib import Path
from PIL import Image

source=Path('assets/img/Ouverture_du_jeu/animations/Warrenfall_ouverture_8_secondes.gif')
output=Path('.cloudinary-local/Warrenfall_ouverture_sans_perte.webp')
original=hashlib.sha256(source.read_bytes()).hexdigest()
image=Image.open(source)
frames=[]
durations=[]
for index in range(image.n_frames):
    image.seek(index)
    frames.append(image.convert('RGBA').copy())
    durations.append(image.info.get('duration',0))
output.parent.mkdir(exist_ok=True)
frames[0].save(output,format='WEBP',save_all=True,append_images=frames[1:],duration=durations,
               loop=image.info.get('loop',0),lossless=True,quality=100,method=0,exact=True)
check=Image.open(output)
equal=check.n_frames==len(frames)
actual=[]
for index in range(check.n_frames):
    check.seek(index)
    decoded=check.convert('RGBA')
    equal=equal and index<len(frames) and decoded.tobytes()==frames[index].tobytes()
    actual.append(check.info.get('duration',0))
result={'original_sha256':original,'original_unchanged':original==hashlib.sha256(source.read_bytes()).hexdigest(),
        'width':image.width,'height':image.height,'frames':len(frames),'duration_ms':sum(durations),
        'webp_bytes':output.stat().st_size,'pixels_identical':equal,'timings_identical':actual==durations,
        'under_limit':output.stat().st_size<=10485760}
Path('.cloudinary-local/animation-lossless-test.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result))
if not all(result[key] for key in ('original_unchanged','pixels_identical','timings_identical','under_limit')):
    raise SystemExit('Copie non qualifiée : aucune intégration ni mise en ligne automatique.')
