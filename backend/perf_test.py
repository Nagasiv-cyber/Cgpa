import asyncio
import time
import random
import os
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()

# pyrefly: ignore [missing-import]
from motor.motor_asyncio import AsyncIOMotorClient
# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient

from main import app
from auth_utils import get_current_user
from database import DB_NAME, MONGO_URL

app.dependency_overrides[get_current_user] = lambda: {"email": "faculty@example.com"}

GRADE_POINTS = {"O": 10, "A+": 9, "A": 8, "B+": 7, "B": 6, "C": 5, "U": 0}
GRADES_LIST = list(GRADE_POINTS.keys())

async def seed_perf_data():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("Clearing db...")
    await db.students.delete_many({})
    await db.subjects.delete_many({})
    await db.results.delete_many({})
    
    print("Inserting 20 subjects...")
    subjects = []
    for i in range(1, 21):
        subjects.append({
            "code": f"SUB{i:03d}",
            "name": f"Perf Subject {i}",
            "abbr": f"PS{i}",
            "credits": random.choice([3, 4]),
            "faculty": "Perf Faculty",
            "semester": "6"
        })
    await db.subjects.insert_many(subjects)
    
    print("Inserting 50 students...")
    students = []
    for i in range(1, 51):
        students.append({
            "register_no": f"PERF{i:04d}",
            "name": f"Perf Student {i}",
            "section": random.choice(["A", "B", "C", "D"]),
            "department": "AIML",
            "batch": "2022-2026",
            "current_cgpa": round(random.uniform(6.0, 9.8), 2),
            "current_semester": 6
        })
    await db.students.insert_many(students)
    
    print("Inserting 1000 grades (50 students * 20 subjects)...")
    results = []
    for student in students:
        grades = {sub["code"]: random.choice(GRADES_LIST) for sub in subjects}
        
        # Calculate SGPA
        total_points = 0
        total_credits = 0
        for sub in subjects:
            c = sub["credits"]
            gp = GRADE_POINTS[grades[sub["code"]]]
            total_credits += c
            total_points += gp * c
            
        sgpa = round(total_points / total_credits, 2)
        
        results.append({
            "register_no": student["register_no"],
            "student_name": student["name"],
            "section": student["section"],
            "semester": "6",
            "grades": grades,
            "sgpa": sgpa,
            "cgpa": student["current_cgpa"],
            "total_credits": total_credits,
            "earned_credits": total_credits, # simplifying
            "arrears": []
        })
    await db.results.insert_many(results)
    
    print("Seed complete.")
    client.close()

def run_perf_tests():
    print("\n--- Running Performance Tests ---")
    with TestClient(app) as client:
        # GET /api/results/semester/6/toppers
        start = time.perf_counter()
        r1 = client.get("/api/results/semester/6/toppers?limit=5")
        t1 = time.perf_counter() - start
        assert r1.status_code == 200
        print(f"/toppers: {t1*1000:.2f} ms")
        
        # GET /api/results/semester/6/subject-analysis
        start = time.perf_counter()
        r2 = client.get("/api/results/semester/6/subject-analysis")
        t2 = time.perf_counter() - start
        assert r2.status_code == 200
        print(f"/subject-analysis: {t2*1000:.2f} ms")
        
        # GET /api/results/semester/6/grade-distribution
        start = time.perf_counter()
        r3 = client.get("/api/results/semester/6/grade-distribution")
        t3 = time.perf_counter() - start
        assert r3.status_code == 200
        print(f"/grade-distribution: {t3*1000:.2f} ms")
        
        # GET /api/results/student/{register_no}
        reg_no = f"PERF{random.randint(1, 50):04d}"
        start = time.perf_counter()
        r4 = client.get(f"/api/students/{reg_no}")
        t4 = time.perf_counter() - start
        assert r4.status_code == 200
        print(f"/students/{{reg_no}}: {t4*1000:.2f} ms")
        
        # Check thresholds
        def check(name, elapsed, threshold_sec):
            if elapsed > threshold_sec:
                print(f"WARNING: {name} exceeded {threshold_sec}s threshold ({elapsed:.2f}s)!")
                
        check("/toppers", t1, 1.0)
        check("/subject-analysis", t2, 1.0)
        check("/grade-distribution", t3, 1.0)
        check("/students/{reg_no}", t4, 0.5)

if __name__ == "__main__":
    asyncio.run(seed_perf_data())
    run_perf_tests()
