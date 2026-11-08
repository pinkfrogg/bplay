import re
with open('client/src/lib/headerWalkVideo.test.ts', 'r') as f:
    text = f.read()

text = re.sub(r'expect\(css\)\.toContain\("\.rail-brand \{ display: grid; justify-items: start; gap: 3px; padding-bottom: 112px;"\);',
              'expect(css).toContain(".rail-brand { background: url(\'https://file.garden/ajiuqJaWwnaROsKw/barbie-assets/header-paris-bg.png\') bottom / cover no-repeat; display: grid; justify-items: start; gap: 3px; padding-bottom: 112px;");',
              text)

with open('client/src/lib/headerWalkVideo.test.ts', 'w') as f:
    f.write(text)

with open('client/src/lib/albumPageLabels.test.ts', 'r') as f:
    text = f.read()

text = re.sub(r'expect\(stylesheet\)\.toContain\("background: linear-gradient\(135deg, #d98a9d, var\(--rosewood-blush\)"\);',
              'expect(stylesheet).toContain("background: #c27587;");',
              text)

with open('client/src/lib/albumPageLabels.test.ts', 'w') as f:
    f.write(text)
