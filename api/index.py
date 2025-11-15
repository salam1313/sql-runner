from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel
import sqlite3
from datetime import datetime

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

class Token(BaseModel):
    access_token: str
    token_type: str
class User(BaseModel):
    username: str
    password: str
class QueryRequest(BaseModel):
    query: str

users = {"admin": pwd_context.hash("admin123")}
recent_queries = {}

def execute_query(query: str):
    conn = sqlite3.connect(':memory:')
    conn.execute('''CREATE TABLE Customers (customer_id INTEGER PRIMARY KEY, first_name VARCHAR, last_name VARCHAR, age INTEGER, country VARCHAR)''')
    conn.execute('''INSERT INTO Customers VALUES (1, 'John', 'Doe', 30, 'USA'), (2, 'Robert', 'Luna', 22, 'USA')''')
    try:
        cursor = conn.execute(query)
        if query.strip().upper().startswith('SELECT'):
            columns = [description[0] for description in cursor.description]
            rows = cursor.fetchall()
            return [dict(zip(columns, row)) for row in rows]
        return {"message": "Query executed"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()

@app.post("/api/token")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    if form_data.username == "admin" and pwd_context.verify(form_data.password, users["admin"]):
        token = jwt.encode({"sub": form_data.username}, "secret", algorithm="HS256")
        return {"access_token": token, "token_type": "bearer"}
    raise HTTPException(status_code=400, detail="Invalid credentials")

@app.post("/api/query")
def run_query(request: QueryRequest):
    return execute_query(request.query)

@app.get("/api/tables")
def get_tables():
    return ["Customers"]