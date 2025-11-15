from jose import jwt
from datetime import datetime

# In-memory storage
user_profiles = {"admin": {"username": "admin", "created_at": datetime.now().isoformat(), "total_queries": 0, "last_login": datetime.now().isoformat()}}

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
            
            return user_profiles.get(username, {"error": "Profile not found"})
            
        except Exception as e:
            return {"error": str(e)}, 401
    
    return {"error": "Method not allowed"}, 405