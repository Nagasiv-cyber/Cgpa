import json
import os
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
load_dotenv()
# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient
from main import app
from auth_utils import get_current_user

app.dependency_overrides[get_current_user] = lambda: {"email": "faculty@example.com"}

def run_tests():
    with TestClient(app) as client:
        print("Testing GET /api/students/AI2201")
        resp1 = client.get("/api/students/AI2201")
        print("Status:", resp1.status_code)
        print(json.dumps(resp1.json(), indent=2))
        
        print("\nTesting GET /api/results/semester/6/toppers?limit=5")
        resp2 = client.get("/api/results/semester/6/toppers?limit=5")
        print("Status:", resp2.status_code)
        if resp2.status_code == 200:
            for t in resp2.json():
                print(f"{t['student_name']}: SGPA {t['sgpa']}")
                
        print("\nTesting GET /api/results/semester/6/subject-analysis")
        resp3 = client.get("/api/results/semester/6/subject-analysis")
        print("Status:", resp3.status_code)
        if resp3.status_code == 200:
            for s in resp3.json():
                print(f"{s['subject_code']}: Passed {s['passed']}, Failed {s['failed']}, Appeared {s['total_appeared']}")
                
        print("\nTesting POST /api/results/bulk")
        bulk_payload = {
            "subject_code": "IT19541",
            "semester": "6",
            "academic_year": "2024-2025",
            "grades": [
                {"student_id": "AI2203", "grade": "O"},
                {"student_id": "AI2204", "grade": "O"},
                {"student_id": "NONEXISTENT", "grade": "O"}
            ]
        }
        resp4 = client.post("/api/results/bulk", json=bulk_payload)
        print("Status:", resp4.status_code)
        print(json.dumps(resp4.json(), indent=2))

if __name__ == "__main__":
    run_tests()
