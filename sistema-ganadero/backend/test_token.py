import urllib.request
import json

url = "http://127.0.0.1:8000/graphql/"
query = 'mutation { tokenAuth(username: "admin", password: "admin123") { token } }'

data = json.dumps({"query": query}).encode()
req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})

try:
    response = urllib.request.urlopen(req)
    print(response.read().decode())
except Exception as e:
    print("Error:", e)
    if hasattr(e, 'read'):
        print(e.read().decode())