from jose import jwt

def handler(request):
    if request.method == "GET":
        try:
            # Get auth token
            auth_header = request.headers.get('authorization', '')
            if not auth_header.startswith('Bearer '):
                return {"error": "Unauthorized"}, 401
            
            token = auth_header.split(' ')[1]
            jwt.decode(token, "secret", algorithms=["HS256"])
            
            return ["Customers", "Orders"]
            
        except Exception as e:
            return {"error": str(e)}
    
    return {"error": "Method not allowed"}