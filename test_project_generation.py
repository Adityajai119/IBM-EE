import requests
import json

# Test the generate-project endpoint
url = "http://localhost:8000/api/code/generate-project"
data = {
    "prompt": "create a simple todo app with HTML, CSS and JavaScript",
    "stack": "vanilla",
    "project_type": "web"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
