import asyncio
import os
# pyrefly: ignore [missing-import]
from motor.motor_asyncio import AsyncIOMotorClient
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "aiml_result_db")

async def verify():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    students_count = await db.students.count_documents({})
    subjects_count = await db.subjects.count_documents({})
    print(f"Students count: {students_count}")
    print(f"Subjects count: {subjects_count}")
    
    print("\n--- Toppers for Semester 6 ---")
    cursor = db.results.find({"semester": "6"}).sort("sgpa", -1).limit(5)
    async for doc in cursor:
        print(f"{doc['student_name']}: SGPA {doc['sgpa']}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(verify())
