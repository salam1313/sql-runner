from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
import db
import sqlite3
import os
from typing import List, Optional
from datetime import datetime

SECRET_KEY = "sqlrunnersecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-frontend-url.vercel.app",
        "https://*.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Token(BaseModel):
    access_token: str
    token_type: str
class TokenData(BaseModel):
    username: Optional[str] = None
class User(BaseModel):
    username: str
    password: str
class QueryRequest(BaseModel):
    query: str
class TableRequest(BaseModel):
    table: str
class RecentQuery(BaseModel):
    query: str
    result: Optional[list] = None

class UserProfile(BaseModel):
    username: str
    created_at: str
    total_queries: int
    last_login: str

users = {}
recent_queries = {}
user_profiles = {}

def init_default_user():
    users["admin"] = pwd_context.hash("admin123")
    user_profiles["admin"] = {
        "username": "admin",
        "created_at": datetime.now().isoformat(),
        "total_queries": 0,
        "last_login": datetime.now().isoformat()
    }

init_default_user()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)
def authenticate_user(username: str, password: str):
    if username in users and verify_password(password, users[username]):
        return User(username=username, password=password)
    return None
def create_access_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        return User(username=username, password="")
    except JWTError:
        raise credentials_exception
@app.post("/register")
def register(user: User):
    if user.username in users:
        raise HTTPException(status_code=400, detail="Username already exists")
    users[user.username] = pwd_context.hash(user.password)
    user_profiles[user.username] = {
        "username": user.username,
        "created_at": datetime.now().isoformat(),
        "total_queries": 0,
        "last_login": datetime.now().isoformat()
    }
    return {"message": "User registered successfully"}
@app.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    if user.username in user_profiles:
        user_profiles[user.username]["last_login"] = datetime.now().isoformat()
    access_token = create_access_token({"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}
@app.post("/query")
def run_query(request: QueryRequest, user: User = Depends(get_current_user)):
    result = db.execute_query(request.query)
    if user.username not in recent_queries:
        recent_queries[user.username] = []
    recent_queries[user.username].append({"query": request.query, "result": result})
    if user.username in user_profiles:
        user_profiles[user.username]["total_queries"] += 1
    return result
@app.get("/tables")
def get_tables(user: User = Depends(get_current_user)):
    return db.get_table_names()
@app.post("/table_info")
def table_info(request: TableRequest, user: User = Depends(get_current_user)):
    return db.get_table_info(request.table)
@app.get("/recent_queries")
def get_recent_queries(user: User = Depends(get_current_user)):
    return recent_queries.get(user.username, [])
@app.get("/profile")
def get_profile(user: User = Depends(get_current_user)):
    if user.username not in user_profiles:
        return {"error": "Profile not found"}
    return user_profiles[user.username]

@app.post("/forgot_password")
def forgot_password(user: User):
    if user.username not in users:
        raise HTTPException(status_code=400, detail="User not found")
    users[user.username] = pwd_context.hash(user.password)
    return {"message": "Password reset successfully"}
