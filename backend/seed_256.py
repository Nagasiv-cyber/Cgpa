"""
seed_256.py — Seeds 256 AIML students (64 per section A/B/C/D)
with realistic Tamil-style names, register numbers, semester 1 and 2
grades, SGPA, CGPA, and arrears into MongoDB.

Run from the backend/ directory:
    .venv\Scripts\python.exe seed_256.py
"""

import asyncio
import os
import random
# pyrefly: ignore [missing-import]
from motor.motor_asyncio import AsyncIOMotorClient
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME   = os.getenv("DB_NAME",   "aiml_result_db")

# ── Subjects (Sem 1 & 2) ──────────────────────────────────────────────────────
SUBJECTS_SEM1 = [
    {"code": "GE23131", "name": "Programming using C", "abbr": "PUC", "credits": 4, "faculty": "TBD", "semester": "1"},
    {"code": "EE23133", "name": "Basic Electrical and Electronics Engineering", "abbr": "BEEE", "credits": 4, "faculty": "TBD", "semester": "1"},
    {"code": "GE23117", "name": "Heritage of Tamils", "abbr": "HOT", "credits": 1, "faculty": "TBD", "semester": "1"},
    {"code": "HS23111", "name": "Technical Communication- I", "abbr": "TC1", "credits": 2, "faculty": "TBD", "semester": "1"},
    {"code": "PH23132", "name": "Physics for Information Science", "abbr": "PIS", "credits": 4, "faculty": "TBD", "semester": "1"},
    {"code": "MA23116", "name": "Mathematical Foundations for AI", "abbr": "MFAI", "credits": 4, "faculty": "TBD", "semester": "1"},
    {"code": "GE23122", "name": "Engineering Practices - Electrical and Electronics", "abbr": "EPEE", "credits": 1, "faculty": "TBD", "semester": "1"},
    {"code": "MC23111", "name": "Indian Constitution and Freedom Movement", "abbr": "ICFM", "credits": 0, "faculty": "TBD", "semester": "1"},
]

SUBJECTS_SEM2 = [
    {"code": "CS23221", "name": "Python Programming Laboratory", "abbr": "PPL", "credits": 2, "faculty": "TBD", "semester": "2"},
    {"code": "CS23231", "name": "Data Structures", "abbr": "DS", "credits": 5, "faculty": "TBD", "semester": "2"},
    {"code": "GE23217", "name": "தமிழரும் தொழில்நுட்பமும் / Tamils and Technology", "abbr": "TAT", "credits": 1, "faculty": "TBD", "semester": "2"},
    {"code": "HS23222", "name": "English for Professional Competence", "abbr": "EPC", "credits": 1, "faculty": "TBD", "semester": "2"},
    {"code": "MA23214", "name": "Probability and Inferential Statistics", "abbr": "PIS2", "credits": 4, "faculty": "TBD", "semester": "2"},
    {"code": "IT23231", "name": "Digital Principles and Computer Architecture", "abbr": "DPCA", "credits": 4, "faculty": "TBD", "semester": "2"},
    {"code": "GE23111", "name": "Engineering Graphics", "abbr": "EG", "credits": 4, "faculty": "TBD", "semester": "2"},
    {"code": "GE23121", "name": "Engineering Practices - Civil and Mechanical", "abbr": "EPCM", "credits": 1, "faculty": "TBD", "semester": "2"},
]

ALL_SUBJECTS = SUBJECTS_SEM1 + SUBJECTS_SEM2
CREDITS_SEM1 = sum(s["credits"] for s in SUBJECTS_SEM1)
CREDITS_SEM2 = sum(s["credits"] for s in SUBJECTS_SEM2)

GRADE_POINTS = {"O": 10, "A+": 9, "A": 8, "B+": 7, "B": 6, "C": 5, "U": 0}

# ── Realistic Tamil names ─────────────────────────────────────────────────────
MALE_NAMES = [
    "Aarav","Abishek","Aditya","Akash","Aravind","Arjun","Ashwin",
    "Balaji","Bharath","Deepak","Dinesh","Gowtham","Harish","Hari",
    "Jagadeesh","Jaikumar","Karthik","Kavin","Kishore","Kumaran",
    "Lokesh","Manikandan","Mohan","Muthu","Naveen","Nithish",
    "Parthiban","Praveen","Rahul","Rajesh","Ram","Ramesh",
    "Sanjay","Santhosh","Saravanan","Senthil","Shiva","Sivaraman",
    "Subash","Sudharsan","Surya","Thilak","Udhay","Varun",
    "Vignesh","Vijay","Vikas","Vishwa","Yuvan","Sriram",
]
FEMALE_NAMES = [
    "Aiswarya","Ananya","Anitha","Anusha","Bhavani","Deepika",
    "Dhivya","Divya","Gowthami","Harini","Indhu","Janani",
    "Jayanthi","Jeevitha","Kamali","Kavitha","Keerthika","Kiruthiga",
    "Kokila","Krishnaveni","Lakshmi","Lavanya","Madhumitha",
    "Mahalakshmi","Meena","Nivetha","Oviya","Pavithra","Pooja",
    "Priadharshni","Priya","Priyanka","Ramya","Ranjitha","Revathi",
    "Sangeetha","Saranya","Selvi","Sneha","Sowmiya","Srimathi",
    "Subha","Suganya","Swetha","Tamilarasi","Thenmozhi","Uma",
    "Vaishnavi","Vanitha","Varsha","Vidhya","Vijayalakshmi","Yamini",
]
LAST_NAMES = [
    "A","B","C","D","G","J","K","M","N","P","R","S","T","V",
    "Annamalai","Arumugam","Balasubramanian","Chandrasekaran",
    "Durai","Gopalakrishnan","Iyer","Krishnamurthy","Murugan",
    "Natarajan","Pandian","Ramasubramanian","Shanmugam",
    "Subramaniam","Thiruvengadam","Venkatesan",
]

def random_name(gender: str) -> str:
    first = random.choice(FEMALE_NAMES if gender == "F" else MALE_NAMES)
    last  = random.choice(LAST_NAMES)
    return f"{first} {last}"

def student_profile() -> str:
    return random.choices(
        ["topper", "average", "below", "arrear"],
        weights=[15, 50, 25, 10]
    )[0]

def weighted_grade(profile: str) -> str:
    if profile == "topper":
        return random.choices(["O","A+","A","B+"], weights=[40,35,20,5])[0]
    elif profile == "average":
        return random.choices(["A+","A","B+","B","C"], weights=[15,30,30,15,10])[0]
    elif profile == "below":
        return random.choices(["B+","B","C","U"], weights=[25,30,30,15])[0]
    else:
        return random.choices(["C","U","B"], weights=[35,45,20])[0]

def generate_grades(profile: str, subjects_list: list) -> dict:
    grades = {}
    for sub in subjects_list:
        # Indian Constitution is 0 credits, usually passes with random grade
        if sub["credits"] == 0:
            grades[sub["code"]] = random.choice(["O","A+","A","B+"])
            continue

        if profile == "arrear" and random.random() < 0.3:
            grades[sub["code"]] = "U"
        else:
            grades[sub["code"]] = weighted_grade(profile)
    return grades

def compute_sgpa(grades: dict, subjects_list: list) -> float:
    pts = sum(GRADE_POINTS[grades[s["code"]]] * s["credits"] for s in subjects_list)
    tot_credits = sum(s["credits"] for s in subjects_list)
    return round(pts / tot_credits, 2) if tot_credits > 0 else 0.0

def compute_arrears(grades: dict) -> list:
    return [code for code, g in grades.items() if g == "U"]

def get_earned_credits(grades: dict, subjects_list: list) -> int:
    earned = 0
    for s in subjects_list:
        if grades.get(s["code"], "U") != "U":
            earned += s["credits"]
    return earned

# ── Main ──────────────────────────────────────────────────────────────────────
async def seed():
    print(f"Connecting to MongoDB …")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    print("Clearing existing collections …")
    for col in ["users", "subjects", "students", "results"]:
        await db[col].delete_many({})

    print("Inserting faculty user …")
    await db.users.insert_one({
        "email": "faculty@aiml.edu",
        "name": "Dr. Head of Department",
        "hashed_password": "$2b$12$N9x/q2b7p2k9b8zX.1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s",
        "role": "faculty",
    })

    print("Inserting 16 subjects for Sem 1 and Sem 2 …")
    await db.subjects.insert_many(ALL_SUBJECTS)

    sections   = ["A", "B", "C", "D"]
    PER_SECTION = 64
    all_students = []
    all_results = []

    for si, section in enumerate(sections):
        base    = si * PER_SECTION
        genders = ["F"] * 38 + ["M"] * 26
        random.shuffle(genders)
        used_names: set = set()

        for j in range(PER_SECTION):
            num    = base + j + 1
            reg_no = f"722522243{num:03d}"

            gender = genders[j]
            for _ in range(20):
                name = random_name(gender)
                if name not in used_names:
                    used_names.add(name)
                    break

            profile = student_profile()
            
            # Sem 1 Result
            grades_sem1  = generate_grades(profile, SUBJECTS_SEM1)
            sgpa_sem1    = compute_sgpa(grades_sem1, SUBJECTS_SEM1)
            arrears_sem1 = compute_arrears(grades_sem1)
            earned_sem1  = get_earned_credits(grades_sem1, SUBJECTS_SEM1)
            
            res_sem1 = {
                "register_no":   reg_no,
                "student_name":  name,
                "section":       section,
                "semester":      "1",
                "grades":        grades_sem1,
                "sgpa":          sgpa_sem1,
                "cgpa":          sgpa_sem1,  # CGPA is same as SGPA in Sem 1
                "total_credits": CREDITS_SEM1,
                "earned_credits": earned_sem1,
                "arrears":       arrears_sem1,
            }
            all_results.append(res_sem1)
            
            # Sem 2 Result
            grades_sem2  = generate_grades(profile, SUBJECTS_SEM2)
            sgpa_sem2    = compute_sgpa(grades_sem2, SUBJECTS_SEM2)
            arrears_sem2 = compute_arrears(grades_sem2)
            earned_sem2  = get_earned_credits(grades_sem2, SUBJECTS_SEM2)
            
            total_earned = earned_sem1 + earned_sem2
            total_credits = CREDITS_SEM1 + CREDITS_SEM2
            
            pts_sem1 = sgpa_sem1 * CREDITS_SEM1
            pts_sem2 = sgpa_sem2 * CREDITS_SEM2
            cgpa = round((pts_sem1 + pts_sem2) / total_credits, 2) if total_credits > 0 else 0.0
            
            res_sem2 = {
                "register_no":   reg_no,
                "student_name":  name,
                "section":       section,
                "semester":      "2",
                "grades":        grades_sem2,
                "sgpa":          sgpa_sem2,
                "cgpa":          cgpa,
                "total_credits": CREDITS_SEM2,
                "earned_credits": earned_sem2,
                "arrears":       arrears_sem2,
            }
            all_results.append(res_sem2)

            # Student Record
            all_students.append({
                "register_no": reg_no,
                "name":        name,
                "section":     section,
                "department":  "AIML",
                "batch":       "2022-2026",
                "email":       f"{reg_no.lower()}@student.aiml.edu",
                "current_cgpa": cgpa,
            })

    print(f"Inserting {len(all_students)} students …")
    await db.students.insert_many(all_students)

    print(f"Inserting {len(all_results)} result records …")
    await db.results.insert_many(all_results)

    # Summary
    sem2_results = [r for r in all_results if r["semester"] == "2"]
    cleared = sum(1 for r in sem2_results if not r["arrears"])
    toppers = sorted(sem2_results, key=lambda r: r["cgpa"], reverse=True)[:5]

    print("\n[OK] Seed complete!")
    print(f"   Students : {len(all_students)}")
    print(f"   Passed Sem 2 : {cleared}  ({cleared/len(sem2_results)*100:.1f}%)")
    print(f"   Arrears in Sem 2: {len(sem2_results)-cleared}")
    print("\nTop 5 CGPA:")
    for i, r in enumerate(toppers, 1):
        print(f"   {i}. {r['student_name']:30s}  [{r['section']}]  CGPA {r['cgpa']:.2f}")

    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
