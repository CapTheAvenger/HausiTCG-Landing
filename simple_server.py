#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys

PORT = 8000
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

try:
    Handler = MyHandler
    httpd = socketserver.TCPServer(("", PORT), Handler)
    print(f"Server running at http://localhost:{PORT}/")
    print(f"Working directory: {os.getcwd()}")
    print("Press CTRL+C to stop")
    httpd.serve_forever()
except KeyboardInterrupt:
    print("\nServer stopped")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
