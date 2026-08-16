import asyncio
import os
import random
# pyrefly: ignore [missing-import]
from motor.motor_asyncio import AsyncIOMotorClient
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "aiml_result_db")

def get_password_hash(password: str) -> str:
    # Use a dummy hash to avoid passlib bcrypt issues, since GET endpoints don't require login
    return "$2b$12$N9x/q2b7p2k9b8zX.1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s"


async def seed_data():
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("Clearing existing data...")
    await db.users.delete_many({})
    await db.subjects.delete_many({})
    await db.students.delete_many({})
    await db.results.delete_many({})
    
    print("Adding sample faculty...")
    faculty = {
        "email": "faculty@example.com",
        "name": "Sample Faculty",
        "hashed_password": get_password_hash("password123"),
        "role": "faculty"
    }
    await db.users.insert_one(faculty)
    
    print("Adding sample subjects...")
    # 7 subjects, semester 6, 22 credits total
    # 24NCS08 (3), AD19643 (4), AD19651 (3), AD19652 (3), AI19442 (4), GE19621 (1), IT19541 (4)
    subjects = [
        {"code": "24NCS08", "name": "Subject 1", "abbr": "S1", "credits": 3, "faculty": "Dr. Smith", "semester": "6"},
        {"code": "AD19643", "name": "Subject 2", "abbr": "S2", "credits": 4, "faculty": "Dr. Jones", "semester": "6"},
        {"code": "AD19651", "name": "Subject 3", "abbr": "S3", "credits": 3, "faculty": "Dr. Brown", "semester": "6"},
        {"code": "AD19652", "name": "Subject 4", "abbr": "S4", "credits": 3, "faculty": "Dr. Davis", "semester": "6"},
        {"code": "AI19442", "name": "Subject 5", "abbr": "S5", "credits": 4, "faculty": "Dr. Wilson", "semester": "6"},
        {"code": "GE19621", "name": "Subject 6", "abbr": "S6", "credits": 1, "faculty": "Dr. Taylor", "semester": "6"},
        {"code": "IT19541", "name": "Subject 7", "abbr": "S7", "credits": 4, "faculty": "Dr. Smith", "semester": "6"},
    ]
    await db.subjects.insert_many(subjects)
    
    print("Adding sample students...")
    # 10 students
    students = [
        {"register_no": "AI2201", "name": "Priadharshni P", "section": "A", "department": "AIML", "batch": "2022-2026", "email": "pria@example.com", "current_cgpa": 8.15},
        {"register_no": "AI2202", "name": "Keerthika P", "section": "A", "department": "AIML", "batch": "2022-2026", "email": "keerthi@example.com", "current_cgpa": 8.20},
        {"register_no": "AI2203", "name": "Student Three", "section": "A", "department": "AIML", "batch": "2022-2026", "email": "s3@example.com", "current_cgpa": 7.5},
        {"register_no": "AI2204", "name": "Student Four", "section": "A", "department": "AIML", "batch": "2022-2026", "email": "s4@example.com", "current_cgpa": 8.0},
        {"register_no": "AI2205", "name": "Student Five", "section": "A", "department": "AIML", "batch": "2022-2026", "email": "s5@example.com", "current_cgpa": 8.1},
        {"register_no": "AI2206", "name": "Student Six", "section": "B", "department": "AIML", "batch": "2022-2026", "email": "s6@example.com", "current_cgpa": 7.2},
        {"register_no": "AI2207", "name": "Student Seven", "section": "B", "department": "AIML", "batch": "2022-2026", "email": "s7@example.com", "current_cgpa": 6.8},
        {"register_no": "AI2208", "name": "Student Eight", "section": "B", "department": "AIML", "batch": "2022-2026", "email": "s8@example.com", "current_cgpa": 8.9},
        {"register_no": "AI2209", "name": "Student Nine", "section": "B", "department": "AIML", "batch": "2022-2026", "email": "s9@example.com", "current_cgpa": 9.1},
        {"register_no": "AI2210", "name": "Student Ten", "section": "B", "department": "AIML", "batch": "2022-2026", "email": "s10@example.com", "current_cgpa": 5.5},
    ]
    await db.students.insert_many(students)
    
    print("Adding sample grades...")
    # Priadharshni P: 8.55 -> O, A+, A+, A, A, B+, A
    pria_grades = {"24NCS08": "O", "AD19643": "A+", "AD19651": "A+", "AD19652": "A", "AI19442": "A", "GE19621": "B+", "IT19541": "A"}
    
    # Keerthika P grades
    keerthi_grades = {"24NCS08": "A+", "AD19643": "A+", "AD19651": "A", "AD19652": "A", "AI19442": "B+", "GE19621": "A", "IT19541": "A+"}
    
    # Random grades for others
    def random_grades():
        return {
            "24NCS08": random.choice(["O", "A+", "A", "B+", "B", "C"]),
            "AD19643": random.choice(["O", "A+", "A", "B+", "B", "C"]),
            "AD19651": random.choice(["O", "A+", "A", "B+", "B", "C"]),
            "AD19652": random.choice(["O", "A+", "A", "B+", "B", "C"]),
            "AI19442": random.choice(["O", "A+", "A", "B+", "B", "C"]),
            "GE19621": random.choice(["O", "A+", "A", "B+", "B", "C"]),
            "IT19541": random.choice(["O", "A+", "A", "B+", "B", "C"]),
        }
        
    results = []
    GRADE_POINTS = {"O": 10, "A+": 9, "A": 8, "B+": 7, "B": 6, "C": 5, "U": 0}
    
    for student in students:
        if student["name"] == "Priadharshni P":
            grades = pria_grades
        elif student["name"] == "Keerthika P":
            grades = keerthi_grades
        else:
            grades = random_grades()
            
        # Calculate SGPA
        total_points = sum(GRADE_POINTS[grades[sub]] * next(s["credits"] for s in subjects if s["code"] == sub) for sub in grades)
        total_credits = 22
        sgpa = round(total_points / total_credits, 2)
        
        results.append({
            "register_no": student["register_no"],
            "student_name": student["name"],
            "section": student["section"],
            "semester": "6",
            "grades": grades,
            "sgpa": sgpa,
            "cgpa": student["current_cgpa"],
            "total_credits": 22,
            "earned_credits": 22,
            "arrears": []
        })
        
    await db.results.insert_many(results)
    
    users_count = await db.users.count_documents({})
    students_count = await db.students.count_documents({})
    subjects_count = await db.subjects.count_documents({})
    
    results_docs = await db.results.find({}).to_list(None)
    grades_count = sum(len(doc.get("grades", {})) for doc in results_docs)
    
    print(f"Users: {users_count}, Students: {students_count}, Subjects: {subjects_count}, Grades: {grades_count}")
    print("Database seeded successfully!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
