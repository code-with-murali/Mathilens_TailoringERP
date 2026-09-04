"""A static server for the exported site that behaves like the real host.

Python's stock http.server is single-threaded and caches aggressively, which makes it abort the
dozens of concurrent prefetches a Next.js page fires and answer repeat requests with 304 — both of
which look exactly like site defects in an automated sweep and are neither. This one is threaded,
sends no-cache, and serves 404.html with a 404 the way Azure Static Web Apps is configured to.
"""
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = sys.argv[1]
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 4322


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        # A short cache rather than no-store: with no-store the Next router treats every prefetch
        # as immediately stale and re-requests it, so the page never reaches network idle and an
        # automated sweep times out waiting for it.
        self.send_header("Cache-Control", "public, max-age=60")
        super().end_headers()

    def send_head(self):
        # Anything that does not resolve to a file gets the exported 404 page, with a 404 status.
        path = self.translate_path(self.path)
        if not os.path.exists(path) and not os.path.isdir(path):
            not_found = os.path.join(ROOT, "404.html")
            if os.path.exists(not_found):
                body = open(not_found, "rb").read()
                self.send_response(404)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                return __import__("io").BytesIO(body)
        return super().send_head()

    def log_message(self, *args):
        pass


print(f"serving {ROOT} on http://127.0.0.1:{PORT}", flush=True)
ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
