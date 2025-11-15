from jose import jwt

# In-memory storage
recent_queries = {}

def handler(request):
    if request.method == "GET":
        try:
            # Get auth token
            auth_header = request.headers.get('authorization', '')
            if not auth_header.startswith('Bearer '):
                return {"error": "Unauthorized"}, 401
            
            token = auth_header.split(' ')[1]
            payload = jwt.decode(token, "secret", algorithms=["HS256"])
            username = payload.get("sub")
            
            return recent_queries.get(username, [])
            
        except Exception as e:
            return {"error": str(e)}, 401
    
    return {"error": "Method not allowed"}, 405