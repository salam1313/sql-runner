from http.server import BaseHTTPRequestHandler
import json
import urllib.parse
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
users = {"admin": pwd_context.hash("admin123")}

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            
            parsed_data = urllib.parse.parse_qs(post_data)
            username = parsed_data.get('username', [''])[0]
            password = parsed_data.get('password', [''])[0]
            
            if username == "admin" and pwd_context.verify(password, users["admin"]):
                token = jwt.encode({"sub": username}, "secret", algorithm="HS256")
                response = {"access_token": token, "token_type": "bearer"}
            else:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"detail": "Incorrect username or password"}).encode())
                return
                
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()