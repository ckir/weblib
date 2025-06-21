from http.server import BaseHTTPRequestHandler, HTTPServer

class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        print("\n--- Request Headers ---")
        for key, value in self.headers.items():
            print(f"{key}: {value}")

        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"Headers received. Check the server console.")

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')

        print("\n--- Request Headers ---")
        for key, value in self.headers.items():
            print(f"{key}: {value}")

        print("\n--- Request Body ---")
        print(body)

        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"Headers and body received. Check the server console.")

if __name__ == "__main__":
    server_address = ("", 8000)  # Listen on port 8080
    httpd = HTTPServer(server_address, RequestHandler)
    print("Server running on port 8000...")
    httpd.serve_forever()
    