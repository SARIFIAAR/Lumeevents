#!/usr/bin/env python3
"""Inline css/js into a single self-contained page: dist/index.html (full doc)
and dist/artifact.html (head+body content only, for claude.ai Artifact preview)."""
import re, pathlib
root = pathlib.Path(__file__).parent
html = (root / 'index.html').read_text()
css = (root / 'css/style.css').read_text()
js = (root / 'js/main.js').read_text()
html = html.replace('<link rel="stylesheet" href="css/style.css">', '<style>\n' + css + '\n</style>')
html = html.replace('<script src="js/main.js"></script>', '<script>\n' + js + '\n</script>')
three = (root / 'js/three-hero.js').read_text()
html = html.replace('<script type="module" src="js/three-hero.js"></script>', '<script type="module">\n' + three + '\n</script>')
(root / 'dist').mkdir(exist_ok=True)
(root / 'dist/index.html').write_text(html)
head = re.search(r'<head>(.*?)</head>', html, re.S).group(1)
body = re.search(r'<body>(.*?)</body>', html, re.S).group(1)
head = re.sub(r'<meta (charset|name="viewport")[^>]*>\s*', '', head)
import base64, shutil
def inline(m):
    p = root / m.group(2)
    if not p.exists(): return m.group(0)
    return m.group(1) + 'data:image/jpeg;base64,' + base64.b64encode(p.read_bytes()).decode() + '"'
body = re.sub(r'((?:src|data-img)=")(assets/[^"]+)"', inline, body)
def inline_png(m):
    p = root / m.group(2)
    return m.group(1) + 'data:image/png;base64,' + base64.b64encode(p.read_bytes()).decode() + '"' if p.exists() else m.group(0)
head = re.sub(r'(href=")(assets/[^"]+\.png)"', inline_png, head)
head = re.sub(r'<link rel="icon" href="favicon.ico"[^>]*>\s*', '', head)
shutil.copy(root / 'favicon.ico', root / 'dist/favicon.ico')
shutil.copytree(root / 'assets', root / 'dist/assets', dirs_exist_ok=True)
(root / 'dist/artifact.html').write_text(head.strip() + '\n' + body.strip() + '\n')
print('built dist/index.html and dist/artifact.html')

# ---------- Concept 2 ----------
o = root / 'option-2'
h2 = (o / 'index.html').read_text()
h2 = h2.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + (o / 'style.css').read_text() + '\n</style>')
h2 = h2.replace('<script src="main.js"></script>', '<script>\n' + (o / 'main.js').read_text() + '\n</script>')
h2 = h2.replace('<script type="module" src="drones.js"></script>', '<script type="module">\n' + (o / 'drones.js').read_text() + '\n</script>')
head2 = re.search(r'<head>(.*?)</head>', h2, re.S).group(1)
body2 = re.search(r'<body>(.*?)</body>', h2, re.S).group(1)
head2 = re.sub(r'<meta (charset|name="viewport")[^>]*>\s*', '', head2)
head2 = re.sub(r'<link rel="icon" href="../favicon.ico"[^>]*>\s*', '', head2)
def inline2(m):
    p = root / m.group(2).replace('../', '')
    if not p.exists(): return m.group(0)
    return m.group(1) + 'data:image/jpeg;base64,' + base64.b64encode(p.read_bytes()).decode() + '"'
body2 = re.sub(r'(src=")(\.\./assets/[^"]+)"', inline2, body2)
head2 = re.sub(r'(href=")(\.\./assets/[^"]+\.png)"', lambda m: m.group(1) + 'data:image/png;base64,' + base64.b64encode((root / m.group(2).replace('../', '')).read_bytes()).decode() + '"', head2)
body2 = body2.replace('href="../"', 'href="https://sarifiaar.github.io/Lumeevents/"')
(root / 'dist/option-2.html').write_text(head2.strip() + '\n' + body2.strip() + '\n')
print('built dist/option-2.html')
