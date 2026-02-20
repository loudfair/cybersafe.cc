#!/usr/bin/env python3
"""cybersafe.cc — API Explorer. Zero dependencies beyond Python stdlib."""

import http.server
import json
import urllib.request
import urllib.error
import urllib.parse
import os
import sys

PORT = int(os.environ.get("PORT", 8080))
BASE = os.path.dirname(os.path.abspath(__file__))
HTML_PATH = os.path.join(BASE, "index.html")


class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"  {args[0]} {args[1]} {args[2]}")

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _json(self, data, status=200):
        body = json.dumps(data, default=str).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self._cors()
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def _html(self, path):
        with open(path, "rb") as f:
            body = f.read()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path in ("/", "/index.html"):
            self._html(HTML_PATH)
        elif parsed.path == "/api/health":
            self._json({"status": "ok", "service": "cybersafe.cc"})
        else:
            self._json({"error": "Not found"}, 404)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path == "/api/proxy":
            length = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw)
            except json.JSONDecodeError:
                self._json({"error": "Invalid JSON payload"}, 400)
                return

            url = payload.get("url", "").strip()
            method = payload.get("method", "GET").upper()
            req_headers = payload.get("headers", {})
            req_body = payload.get("body")

            if not url:
                self._json({"error": "url is required"}, 400)
                return

            # Only allow http/https
            if not url.startswith(("http://", "https://")):
                self._json({"error": "Only http/https URLs are supported"}, 400)
                return

            try:
                body_bytes = req_body.encode() if req_body else None
                req = urllib.request.Request(url, data=body_bytes, method=method)

                # Default headers
                req.add_header("User-Agent", "cybersafe.cc/1.0")
                for k, v in req_headers.items():
                    req.add_header(k, v)

                with urllib.request.urlopen(req, timeout=15) as resp:
                    resp_body = resp.read().decode("utf-8", errors="replace")
                    resp_headers = dict(resp.headers)
                    self._json({
                        "status": resp.status,
                        "statusText": resp.reason,
                        "body": resp_body,
                        "headers": resp_headers,
                    })

            except urllib.error.HTTPError as e:
                try:
                    err_body = e.read().decode("utf-8", errors="replace")
                except Exception:
                    err_body = str(e)
                self._json({
                    "status": e.code,
                    "statusText": e.reason,
                    "body": err_body,
                    "headers": dict(e.headers) if e.headers else {},
                })
            except urllib.error.URLError as e:
                self._json({
                    "status": 0,
                    "statusText": "Connection Error",
                    "body": str(e.reason),
                    "headers": {},
                })
            except Exception as e:
                self._json({
                    "status": 0,
                    "statusText": "Error",
                    "body": str(e),
                    "headers": {},
                })
        else:
            self._json({"error": "Not found"}, 404)


def main():
    server = http.server.ThreadingHTTPServer(("", PORT), Handler)
    print(f"\n  cybersafe.cc")
    print(f"  ────────────────────────────")
    print(f"  Running at  http://localhost:{PORT}")
    print(f"  Press Ctrl+C to stop\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Stopped.")
        sys.exit(0)


if __name__ == "__main__":
    main()
