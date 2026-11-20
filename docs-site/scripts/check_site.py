"""Check the links shipped by the account site's two static pages."""

from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.parse import urlsplit

PUBLIC = Path(__file__).resolve().parents[1] / "public"
BOOKS = {"/saige/", "/orchagent/", "/humagen/"}


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
print("Verified project links, 404 recovery and shared assets")
