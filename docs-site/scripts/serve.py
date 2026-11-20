"""Preview a Pages artifact, including its root 404 page, on localhost."""

import argparse
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class PagesHandler(SimpleHTTPRequestHandler):
    def send_error(self, code, message=None, explain=None):
        if code != HTTPStatus.NOT_FOUND:
            return super().send_error(code, message, explain)
        body = (Path(self.directory) / "404.html").read_bytes()
        self.send_response(code)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--directory", type=Path, default=Path("public"))
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    if not (args.directory / "404.html").is_file():
        parser.error(f"No built site in {args.directory}")
    handler = partial(PagesHandler, directory=args.directory.resolve())
    with ThreadingHTTPServer(("127.0.0.1", args.port), handler) as server:
        print(f"Preview at http://127.0.0.1:{args.port}/", flush=True)
        server.serve_forever()
