import json
from jose import jwt

def handler(request):
    if request.method == "POST":
        try:
            # Get auth token
            auth_header = request.headers.get('authorization', '')
            if not auth_header.startswith('Bearer '):
                return {"error": "Unauthorized"}, 401
            
            token = auth_header.split(' ')[1]
            jwt.decode(token, "secret", algorithms=["HS256"])
            
            # Get table name from request
            body = json.loads(request.body)
            table = body.get('table', '')
            
            if table == "Customers":
                return {
                    "columns": [
                        {"name": "customer_id", "type": "INTEGER"},
                        {"name": "first_name", "type": "VARCHAR"},
                        {"name": "last_name", "type": "VARCHAR"},
                        {"name": "age", "type": "INTEGER"},
                        {"name": "country", "type": "VARCHAR"}
                    ],
                    "sample_data": [
                        {"customer_id": 1, "first_name": "John", "last_name": "Doe", "age": 30, "country": "USA"}
                    ]
                }
            elif table == "Orders":
                return {
                    "columns": [
                        {"name": "order_id", "type": "INTEGER"},
                        {"name": "item", "type": "VARCHAR"},
                        {"name": "amount", "type": "INTEGER"},
                        {"name": "customer_id", "type": "INTEGER"}
                    ],
                    "sample_data": [
                        {"order_id": 1, "item": "Keyboard", "amount": 400, "customer_id": 1}
                    ]
                }
            
            return {"columns": [], "sample_data": []}
            
        except Exception as e:
            return {"error": str(e)}, 401
    
    return {"error": "Method not allowed"}, 405