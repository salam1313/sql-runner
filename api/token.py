from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime

app = FastAPI()
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

users = {"admin": pwd_context.hash("admin123")}
user_profiles = {"admin": {"username": "admin", "created_at": datetime.now().isoformat(), "total_queries": 0, "last_login": datetime.now().isoformat()}}

def handler(request):
    if request.method == "POST":
        form_data = request.form
        username = form_data.get("username")
        password = form_data.get("password")
        
        if username in users and pwd_context.verify(password, users[username]):
            if username in user_profiles:
                user_profiles[username]["last_login"] = datetime.now().isoformat()
            token = jwt.encode({"sub": username}, "secret", algorithm="HS256")
            return {"access_token": token, "token_type": "bearer"}
        
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    return {"error": "Method not allowed"}