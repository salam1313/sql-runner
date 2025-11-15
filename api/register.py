import json
from passlib.context import CryptContext
from datetime import datetime

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# In-memory storage (in production, use a database)
users = {"admin": pwd_context.hash("admin123")}
user_profiles = {"admin": {"username": "admin", "created_at": datetime.now().isoformat(), "total_queries": 0, "last_login": datetime.now().isoformat()}}

def handler(request):
    if request.method == "POST":
        try:
            body = json.loads(request.body)
            username = body.get('username')
            password = body.get('password')
            
            if username in users:
                return {"detail": "Username already exists"}, 400
            
            users[username] = pwd_context.hash(password)
            user_profiles[username] = {
                "username": username,
                "created_at": datetime.now().isoformat(),
                "total_queries": 0,
                "last_login": datetime.now().isoformat()
            }
            
            return {"message": "User registered successfully"}
            
        except Exception as e:
            return {"detail": str(e)}, 400
    
    return {"error": "Method not allowed"}, 405