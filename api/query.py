import sqlite3
import json
from jose import jwt

def execute_query(query: str):
    conn = sqlite3.connect(':memory:')
    conn.execute('''CREATE TABLE Customers (customer_id INTEGER PRIMARY KEY, first_name VARCHAR, last_name VARCHAR, age INTEGER, country VARCHAR)''')
    conn.execute('''CREATE TABLE Orders (order_id INTEGER PRIMARY KEY, item VARCHAR, amount INTEGER, customer_id INTEGER)''')
    conn.execute('''INSERT INTO Customers VALUES (1, 'John', 'Doe', 30, 'USA'), (2, 'Robert', 'Luna', 22, 'USA'), (3, 'David', 'Robinson', 25, 'UK')''')
    conn.execute('''INSERT INTO Orders VALUES (1, 'Keyboard', 400, 1), (2, 'Mouse', 300, 2)''')
    
    try:
        cursor = conn.execute(query)
        if query.strip().upper().startswith('SELECT'):
            columns = [description[0] for description in cursor.description]
            rows = cursor.fetchall()
            return [dict(zip(columns, row)) for row in rows]
        conn.commit()
        return {"message": "Query executed successfully"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()

def handler(request):
    if request.method == "POST":
        try:
            # Get auth token
            auth_header = request.headers.get('authorization', '')
            if not auth_header.startswith('Bearer '):
                return {"error": "Unauthorized"}, 401
            
            token = auth_header.split(' ')[1]
            jwt.decode(token, "secret", algorithms=["HS256"])
            
            # Get query from request
            body = json.loads(request.body)
            query = body.get('query', '')
            
            if not query.strip():
                return {"error": "Please write a query before running."}
            
            result = execute_query(query)
            return result
            
        except Exception as e:
            return {"error": str(e)}
    
    return {"error": "Method not allowed"}