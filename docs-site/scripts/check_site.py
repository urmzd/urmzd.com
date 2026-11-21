"""Check the links shipped by the account site's two static pages."""

from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.parse import urlsplit

PUBLIC = Path(__file__).resolve().parents[1] / "public"
BOOKS = {"/saige/", "/orchagent/", "https://docs.withhumagen.com/", "https://docs.o4ve.com/"}
# Guides that moved to their own domain: the old directory must redirect there.
MOVED = {"humagen": "https://docs.withhumagen.com/"}


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.anchors = set()
        self.stylesheets = []
        self.assets = []

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == "a" and attrs.get("href"):
            self.anchors.add(attrs["href"])
        if tag in ("link", "script", "use") and "preconnect" not in attrs.get("rel", "").split():
            target = attrs.get("src") or attrs.get("href")
            if target and not urlsplit(target).netloc:
                self.assets.append(target)
        if tag == "link" and "stylesheet" in attrs.get("rel", "").split():
            self.stylesheets.append(attrs["href"])


for name, required in [("index.html", BOOKS), ("404.html", {"/"})]:
    links = Links()
    links.feed((PUBLIC / name).read_text())
    missing = required - links.anchors
    if missing:
        raise SystemExit(f"{name} is missing links to {sorted(missing)}")
    if not links.stylesheets:
        raise SystemExit(f"{name} is missing its stylesheet")
    for asset in links.assets:
        path = urlsplit(asset).path.lstrip("/")
        if not (PUBLIC / path).is_file():
            raise SystemExit(f"{name} references missing asset {asset}")
    for href in links.stylesheets:
        if name == "404.html" and not href.startswith("/"):
            raise SystemExit(f"The 404 stylesheet must resolve from a missing nested URL: {href}")

for book, target in MOVED.items():
    stubs = sorted((PUBLIC / book).rglob("index.html"))
    if PUBLIC / book / "index.html" not in stubs:
        raise SystemExit(f"/{book}/ must redirect to {target}")
    for stub in stubs:
        rel = stub.parent.relative_to(PUBLIC / book).as_posix()
        url = target + (rel + "/" if rel != "." else "")
        if f'content="0; url={url}"' not in stub.read_text():
            raise SystemExit(f"{stub.relative_to(PUBLIC)} must redirect to {url}")
    if f'{book}: "{target}"' not in (PUBLIC / "404.html").read_text():
        raise SystemExit(f"404.html must send /{book}/ deep links to {target}")

# Product repos load this stylesheet directly from the account domain.
if not (PUBLIC / "brand/zensical.css").is_file():
    raise SystemExit("Missing shared Zensical stylesheet")
for css in PUBLIC.rglob("*.css"):
    for ref in re.findall(r"""url\(\s*["']?([^"')]+)""", css.read_text()):
        url = urlsplit(ref)
        if url.scheme or url.netloc:
            continue
        target = PUBLIC / url.path.lstrip("/") if url.path.startswith("/") else css.parent / url.path
        if not target.is_file():
            raise SystemExit(f"{css.name} references missing asset {ref}")
print("Verified project links, moved-guide redirects, 404 recovery and shared assets")
