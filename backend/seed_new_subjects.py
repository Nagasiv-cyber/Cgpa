"""
seed_new_subjects.py - Replaces subjects with 1st and 2nd semester subjects.
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME   = os.getenv("DB_NAME",   "aiml_result_db")

NEW_SUBJECTS = [
    # 1st Semester
    {"code": "GE23131", "name": "Programming using C", "abbr": "PUC", "credits": 4, "faculty": "TBD", "semester": "I Semester"},
    {"code": "EE23133", "name": "Basic Electrical and Electronics Engineering", "abbr": "BEEE", "credits": 4, "faculty": "TBD", "semester": "I Semester"},
    {"code": "GE23117", "name": "Heritage of Tamils", "abbr": "HOT", "credits": 1, "faculty": "TBD", "semester": "I Semester"},
    {"code": "HS23111", "name": "Technical Communication- I", "abbr": "TC1", "credits": 2, "faculty": "TBD", "semester": "I Semester"},
    {"code": "PH23132", "name": "Physics for Information Science", "abbr": "PIS", "credits": 4, "faculty": "TBD", "semester": "I Semester"},
    {"code": "MA23116", "name": "Mathematical Foundations for AI", "abbr": "MFAI", "credits": 4, "faculty": "TBD", "semester": "I Semester"},
    {"code": "GE23122", "name": "Engineering Practices - Electrical and Electronics", "abbr": "EPEE", "credits": 1, "faculty": "TBD", "semester": "I Semester"},
    {"code": "MC23111", "name": "Indian Constitution and Freedom Movement", "abbr": "ICFM", "credits": 0, "faculty": "TBD", "semester": "I Semester"},

    # 2nd Semester
    {"code": "CS23221", "name": "Python Programming Laboratory", "abbr": "PPL", "credits": 2, "faculty": "TBD", "semester": "II Semester"},
    {"code": "CS23231", "name": "Data Structures", "abbr": "DS", "credits": 5, "faculty": "TBD", "semester": "II Semester"},
    {"code": "GE23217", "name": "தமிழரும் தொழில்நுட்பமும் / Tamils and Technology", "abbr": "TAT", "credits": 1, "faculty": "TBD", "semester": "II Semester"},
    {"code": "HS23222", "name": "English for Professional Competence", "abbr": "EPC", "credits": 1, "faculty": "TBD", "semester": "II Semester"},
    {"code": "MA23214", "name": "Probability and Inferential Statistics", "abbr": "PIS2", "credits": 4, "faculty": "TBD", "semester": "II Semester"},
    {"code": "IT23231", "name": "Digital Principles and Computer Architecture", "abbr": "DPCA", "credits": 4, "faculty": "TBD", "semester": "II Semester"},
    {"code": "GE23111", "name": "Engineering Graphics", "abbr": "EG", "credits": 4, "faculty": "TBD", "semester": "II Semester"},
    {"code": "GE23121", "name": "Engineering Practices - Civil and Mechanical", "abbr": "EPCM", "credits": 1, "faculty": "TBD", "semester": "II Semester"},
]

async def seed():
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    print("Dropping old subjects...")
    await db.subjects.delete_many({})

    print("Inserting new 1st and 2nd semester subjects...")
    await db.subjects.insert_many(NEW_SUBJECTS)
    print("Done! Inserted", len(NEW_SUBJECTS), "subjects.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
