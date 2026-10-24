import xml.etree.ElementTree as ET, pathlib
for name in ("marca.svg","logo.svg"):
    p = pathlib.Path("out")/name
    t = ET.parse(p); r = t.getroot()
    tags = {}
    for e in r.iter():
        tags[e.tag.split("}")[-1]] = tags.get(e.tag.split("}")[-1],0)+1
    print(f"{name}: OK xml, viewBox={r.get('viewBox')}, w={r.get('width')}, h={r.get('height')}, elems={tags}")
print("text elements in marca.svg:", [e.tag.split('}')[-1] for e in ET.parse('out/marca.svg').getroot().iter()].count('text'))
