"""
Standalone Local Development Server.
Simulates AWS API Gateway + Lambda proxy integration locally using Python's
built-in standard library http.server (no external dependencies required).
Runs on http://localhost:8000 for local live demonstrations (Lab 12 demo).
"""
import json
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_root = Path(__file__).resolve().parent.parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from backend.app.lambda_handler import handler

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("LocalAPIGateway")

class LocalAPIGatewayHandler(BaseHTTPRequestHandler):
    def _dispatch(self, method: str):
        parsed = urlparse(self.path)
        path = parsed.path
        query_params = {k: v[0] if len(v) == 1 else v for k, v in parse_qs(parsed.query).items()}

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else ""

        # Formulate AWS API Gateway proxy event
        event = {
            "httpMethod": method,
            "path": path,
            "queryStringParameters": query_params,
            "headers": dict(self.headers),
            "body": body,
            "requestContext": {
                "http": {
                    "method": method,
                    "path": path
                }
            }
        }

        # Invoke AWS Lambda handler
        response = handler(event, None)

        status_code = response.get("statusCode", 200)
        headers = response.get("headers", {})
        body_content = response.get("body", "")

        self.send_response(status_code)
        for h_key, h_val in headers.items():
            self.send_header(h_key, h_val)
        self.end_headers()

        if isinstance(body_content, str):
            self.wfile.write(body_content.encode("utf-8"))
        elif isinstance(body_content, bytes):
            self.wfile.write(body_content)

    def do_OPTIONS(self):
        self._dispatch("OPTIONS")

    def do_GET(self):
        self._dispatch("GET")

    def do_POST(self):
        self._dispatch("POST")

    def log_message(self, format, *args):
        logger.info("%s - - %s", self.address_string(), format % args)

def run_server(port: int = 8000):
    server_address = ("127.0.0.1", port)
    httpd = HTTPServer(server_address, LocalAPIGatewayHandler)
    logger.info("=" * 65)
    logger.info("  AUDIO ARCHITECTURE & PLAYLIST STRUCTURING API - LOCAL GATEWAY")
    logger.info("  Simulating AWS API Gateway -> AWS Lambda execution")
    logger.info("  Local API Endpoint: http://localhost:%d", port)
    logger.info("  Health Check:       http://localhost:%d/health", port)
    logger.info("  Presets:            http://localhost:%d/presets", port)
    logger.info("  Genres:             http://localhost:%d/genres", port)
    logger.info("=" * 65)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("Server shutting down.")
        httpd.server_close()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run_server(port)
