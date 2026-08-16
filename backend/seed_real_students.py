"""
seed_real_students.py — Seeds the 256 real AIML students into MongoDB.

Register numbers: 251501001 – 251501256
Sections: A (1–64), B (65–128), C (129–192), D (193–256)
Grades: EMPTY — faculty will enter grades manually through the portal.

Run from the backend/ directory:
    .venv/Scripts/python.exe seed_real_students.py
"""

import asyncio
import os
# pyrefly: ignore [missing-import]
from motor.motor_asyncio import AsyncIOMotorClient
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME   = os.getenv("DB_NAME",   "aiml_result_db")

STUDENT_NAMES = [
    # Section A (1-64)
    "ABHIJAY M REDDY", "R ABHIRAMI", "B ABIRAAMI", "ABIRAMI C", "ABISHEG P",
    "ABISHEK BABU T S", "ABISHEK SANDRON S A", "ADARSH A S", "AGOBILAN M", "S AJAY",
    "AJAY KUMAR M", "AKSHAYA S", "ANGUPRABHU A", "ANITH KRISHNAN MURALIDHARAN",
    "ANURADHA S", "ANUSH R", "M R ANUVARSHINI", "ARAVIND GANESAN", "ARAWINDA RAJH S",
    "ARJUN MADHAVAN H", "ARUNACHALAM D", "A ARYA", "ASAD NOUMEN A", "ASHIF HUSSAIN M",
    "ASHIF S", "R ASHISH", "ASHWIN S R", "ASHWIN V", "BARATH KUMAR S", "BARATH S",
    "BHAVANA S", "BHAVANA SREE P", "BHAWANEASH J K", "BHUVAN BHANDARI B", "BHUVAN N G",
    "BINUCHRISTO J", "BUVANESH P", "CALAB ISACK ROY G", "CHRIS JOHAN B J", "DAKSHIN B",
    "DEENA M", "DEEPASRI S", "DEVA SENAPATHY T S S", "DEVAYANAI LAKSHMI E", "DEVIKA P",
    "DEVISRI S", "DHANUSHRI A", "S DHARSHINI", "DHARUN M", "DHEEP RISHI S",
    "DILLI PRASATH B M", "DINESH V", "DINESHKUMAR S", "DIVAKAR B", "DIVAKAR D",
    "DIVYA K", "DRAVID KUMARAN M", "ESHVAR M S", "ESWAR S", "FAAIZA MOHSIN",
    "GAYATHRI D", "GIRIVASAN R", "V GOKUL", "GOKUL L",
    # Section B (65-128)
    "M GOKUL NANDHA", "GOKULAPRIYA P", "R GOMATHI", "GOMATHI A", "GOPIKA A",
    "GOWTHAMAN P", "GURU PPRIYAN S", "GURU VISHNU S", "GURUNETHRA K", "GURUSHARAN R",
    "GUTTI SIVA SAI TEJA", "HAKESH G", "HAMRISH KUMAR S", "P HANISH", "S D HARI HARAN",
    "HARI KRISHNAN G K", "HARIKARAMUTHAN ARUMUGAM", "HARIKRISHNAN K", "S HARINI",
    "HARISH R", "K S HARSHITA", "M B HARSHITH", "HEMANATHAN S", "HENAGRACE A",
    "JAGADEESH J", "JAISHREE V", "JAIVIGNESHAN S", "JASWANT V V", "JASWANTH V",
    "JASWANTHRAM S", "JEEVA S", "JEEVARTHANAN A", "JESSWANTH K P", "JOSHUA SAMUEL D",
    "KABILAN J", "KAMALESHWARAN V", "KARTHICKRAJA B", "KAUSHIK RAAM H", "KAVINESAN P",
    "KAYALVIZHI K", "KEERTHANA H", "KEERTHI D", "KEVIN S THOMAS", "S KIRTHIK",
    "KIRUSAANTH R", "KISHOR A", "KISHORE KUMAR B", "KRISHNA DHIVAGAR R",
    "LAKSHMANA PERUMAL S", "LATHIKASRI A", "LATHISH R", "LEKASRI A", "LOGESHWARI B",
    "LOHITRAM S", "LOKESH M", "LOKESH S", "LOSHINI D", "MADHAVAN P", "J MADHUMITA",
    "MADHUMITA S", "MADHUNISHA C S", "MANIMARAN S", "MANOJ KUMAR E", "MATHAN R",
    # Section C (129-192)
    "MAYANK SHARMA", "MEENA ROSHINI S", "MERVIN REMO D W",
    "MICHELLE CATHERINE ANTONICA A", "MITHRA SHREE M", "N MOHAMED FAIYAZ",
    "MOHAMMED SHAAHID AHMED F", "MONIKA S", "MONISHA S L", "MONO PRIYA M",
    "MUGHILAN S", "MUKESH D", "K NANDA KISHOR CHOUDARY", "M NANDHAN",
    "NARAIN SUNJEIY A S", "NARESH KUMAR L", "NARESH KUMAR R J", "R NERANGEN",
    "NIKASH A", "NIMISHA R", "G P NIRANJAN", "NIRANJANA D", "NIRPPESH KARTHICK S",
    "NITHESH V G", "NITHIN M", "NITHIN S", "NITHISH V", "S NITISH", "NIVEDHITHA N",
    "PANIVU M", "PARAMESHWARAN K", "PAVAN KRISH R", "PAVAN T A", "PRADEEP S",
    "K S PRAGNA", "B PRAMODH", "PRANEET S", "PRANITHAESWARI K S", "PRASANNA K",
    "PRATHUSH RAJ M", "PRAVEEN M", "PRAVINA K", "PREM PA", "PRIYA M", "PRIYANKA B",
    "PUGAZH S", "PUGAZHENTHI B", "RAGHUL R", "RAGHUL S", "RAGSHANTH I", "RAHUL M A",
    "RAKESH V", "RAKSHITHA V", "RAMANATHEESWARAN S", "V RAVIPRASANTH", "REESHMA S",
    "REKHA T", "RISHIDHAR S Y", "RITHESH N", "J RITHIKA", "ROHIT SRIRAM",
    "ROSHAN PRASATH NAGARAJAN DHANDAPANI", "ROSHINI A", "ROSHINI SHREE V",
    # Section D (193-256)
    "S NITHIN AARON SMILE", "SAIVARUN NAGAVEL SIVAKUMAR", "SAJIV DANIEL J",
    "SAMVARTHINI R V", "SANJAY M", "SANJAY P", "SANJAY R", "SANJAY RAM P",
    "SARANRAJ D", "SATHIYA MOORTHY R", "A Y SHAMYUKTHA", "SHARATH D S",
    "SHARUKESH P", "SHESHASHREE ARUNKUMAR", "SHIVANAND A", "SHREE RAM VISHAL M",
    "SHREE THANISH S", "SHREEYA K", "SHREYA SRIVATSAN", "SHYAM R", "S SHYAM SUNDAR",
    "SIVA G", "SIVALINGAM S", "SHENA S", "SOBAN M U", "SORNARAJ K", "SREE KRISHNA K",
    "SREEKUMARAN U", "G SREESHANTH", "M SRI SHANTH", "SRIMATHI A", "SRIMATHI P",
    "SRINITHI S", "SRIVATHSAN S", "SUNDAR RAJ E", "SUNIL KUMAR V",
    "SURIYA NARAYANA K", "SURYA S", "SWAMINATHAN R", "SWETHA T", "TAMILNESAN B",
    "J TEJASWINI", "TEJESHWARA K", "THARUN AADHITHYA S A", "THARUN ASHWATH A",
    "THARUN M S", "THARUNRAJA S", "THAVASRI A S", "UDHAY K", "VAMSHIKA SAARIYA",
    "A J K VAMSI", "VARSHINI P", "VEDHHAVARSHINI B P", "VIGNESH P", "K VISAGAN",
    "V S VISVESHWAR", "VITHYA A", "YASHWANTH RAJ R", "YOKESH A", "R YUVASHREE",
    "ZISHAN JAMAL M", "ZUBAIR AHAMED J",
]

SUBJECTS_SEM1 = [
    {"code": "GE23131", "name": "Programming using C", "abbr": "PUC", "credits": 4, "faculty": "TBD", "semester": "I Semester"},
    {"code": "EE23133", "name": "Basic Electrical and Electronics Engineering", "abbr": "BEEE", "credits": 4, "faculty": "TBD", "semester": "I Semester"},
    {"code": "GE23117", "name": "Heritage of Tamils", "abbr": "HOT", "credits": 1, "faculty": "TBD", "semester": "I Semester"},
    {"code": "HS23111", "name": "Technical Communication- I", "abbr": "TC1", "credits": 2, "faculty": "TBD", "semester": "I Semester"},
    {"code": "PH23132", "name": "Physics for Information Science", "abbr": "PIS", "credits": 4, "faculty": "TBD", "semester": "I Semester"},
    {"code": "MA23116", "name": "Mathematical Foundations for AI", "abbr": "MFAI", "credits": 4, "faculty": "TBD", "semester": "I Semester"},
    {"code": "GE23122", "name": "Engineering Practices - Electrical and Electronics", "abbr": "EPEE", "credits": 1, "faculty": "TBD", "semester": "I Semester"},
    {"code": "MC23111", "name": "Indian Constitution and Freedom Movement", "abbr": "ICFM", "credits": 0, "faculty": "TBD", "semester": "I Semester"},
]

SUBJECTS_SEM2 = [
    {"code": "CS23221", "name": "Python Programming Laboratory", "abbr": "PPL", "credits": 2, "faculty": "TBD", "semester": "II Semester"},
    {"code": "CS23231", "name": "Data Structures", "abbr": "DS", "credits": 5, "faculty": "TBD", "semester": "II Semester"},
    {"code": "GE23217", "name": "தமிழரும் தொழில்நுட்பமும் / Tamils and Technology", "abbr": "TAT", "credits": 1, "faculty": "TBD", "semester": "II Semester"},
    {"code": "HS23222", "name": "English for Professional Competence", "abbr": "EPC", "credits": 1, "faculty": "TBD", "semester": "II Semester"},
    {"code": "MA23214", "name": "Probability and Inferential Statistics", "abbr": "PIS2", "credits": 4, "faculty": "TBD", "semester": "II Semester"},
    {"code": "IT23231", "name": "Digital Principles and Computer Architecture", "abbr": "DPCA", "credits": 4, "faculty": "TBD", "semester": "II Semester"},
    {"code": "GE23111", "name": "Engineering Graphics", "abbr": "EG", "credits": 4, "faculty": "TBD", "semester": "II Semester"},
    {"code": "GE23121", "name": "Engineering Practices - Civil and Mechanical", "abbr": "EPCM", "credits": 1, "faculty": "TBD", "semester": "II Semester"},
]

ALL_SUBJECTS = SUBJECTS_SEM1 + SUBJECTS_SEM2


def section_for(index: int) -> str:
    return ["A", "B", "C", "D"][index // 64]


async def seed():
    total = len(STUDENT_NAMES)
    print(f"Name count check: {total}")
    assert total == 254, f"Expected 254 names, got {total}"

    print("Connecting to MongoDB ...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    print("Clearing existing collections ...")
    for col in ["users", "subjects", "students", "results"]:
        await db[col].delete_many({})

    print("Inserting faculty user ...")
    await db.users.insert_one({
        "email": "faculty@aiml.edu",
        "name":  "Dr. Head of Department",
        "hashed_password": "$2b$12$N9x/q2b7p2k9b8zX.1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s",
        "role":  "faculty",
    })

    print("Inserting subjects ...")
    await db.subjects.insert_many(ALL_SUBJECTS)

    print("Building student records ...")
    students = []
    for i, name in enumerate(STUDENT_NAMES):
        reg_no  = f"251501{i + 1:03d}"
        section = section_for(i)
        email   = f"{reg_no.lower()}@student.aiml.edu"
        students.append({
            "register_no":  reg_no,
            "name":         name,
            "section":      section,
            "department":   "AIML",
            "batch":        "2022-2026",
            "email":        email,
            "current_cgpa": 0.0,
        })

    print(f"Inserting {len(students)} students ...")
    await db.students.insert_many(students)

    print("Results collection left empty - grades will be entered manually.")
    print("\n[OK] Seed complete!")
    print(f"   Students  : {len(students)}")
    for sec in ["A", "B", "C", "D"]:
        count = sum(1 for s in students if s["section"] == sec)
        print(f"   Section {sec} : {count} students")
    print(f"\n   Register numbers: {students[0]['register_no']} -> {students[-1]['register_no']}")
    print("\n[NOTE] No grades inserted - use the Grade Entry page to add grades manually.")

    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
