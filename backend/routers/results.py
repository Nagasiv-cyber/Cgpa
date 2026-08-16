# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Dict, Optional, Any

try:
    from backend.database import get_database
    from backend.schemas import (
        SGPAComputationInput, SGPAComputationResponse,
        StudentResultSubmit, StudentResultResponse, SubjectStatsResponse,
        GRADE_POINTS, GradeCode, BulkGradeSubmit, BulkGradeResponse
    )
    from backend.auth_utils import get_current_user
except ImportError:
    try:
        from database import get_database
        from schemas import (
            SGPAComputationInput, SGPAComputationResponse,
            StudentResultSubmit, StudentResultResponse, SubjectStatsResponse,
            GRADE_POINTS, GradeCode, BulkGradeSubmit, BulkGradeResponse
        )
        from auth_utils import get_current_user
    except ImportError:
        from ..database import get_database
        from ..schemas import (
            SGPAComputationInput, SGPAComputationResponse,
            StudentResultSubmit, StudentResultResponse, SubjectStatsResponse,
            GRADE_POINTS, GradeCode, BulkGradeSubmit, BulkGradeResponse
        )
        from ..auth_utils import get_current_user


router = APIRouter(prefix="/results", tags=["Results & SGPA/CGPA"])

async def get_subject_credits_map() -> Dict[str, int]:
    """Helper to fetch subject code -> credits map from DB or default catalog."""
    db = get_database()
    cursor = db.subjects.find()
    sub_map = {}
    async for doc in cursor:
        sub_map[doc["code"]] = doc["credits"]
    
    # Fallback default credits map if DB is empty
    if not sub_map:
        sub_map = {
            "AD19643": 4, "24NCS08": 4, "AD19651": 3,
            "AD19662": 3, "CS19671": 3, "AD19681": 2
        }
    return sub_map

def compute_sgpa_from_grades(grades: Dict[str, GradeCode], credits_map: Dict[str, int]):
    """Core calculation logic for SGPA and Arrears."""
    total_points = 0
    total_credits = 0
    earned_credits = 0
    arrears = []

    for sub_code, grade in grades.items():
        credits = credits_map.get(sub_code, 3)
        total_credits += credits
        gp = GRADE_POINTS.get(grade, 0)
        
        if grade == "U":
            arrears.append(sub_code)
        else:
            earned_credits += credits
            
        total_points += gp * credits

    sgpa = round(total_points / total_credits, 2) if total_credits > 0 else 0.0
    return sgpa, total_credits, earned_credits, arrears

async def compute_cumulative_cgpa(register_no: str, db) -> float:
    """Compute exact CGPA across all historical semesters for a student."""
    cursor = db.results.find({"register_no": register_no})
    total_earned_points = 0
    total_attempted_credits = 0
    
    credits_map = await get_subject_credits_map()
    
    async for result_doc in cursor:
        for sub_code, grade in result_doc.get("grades", {}).items():
            credits = credits_map.get(sub_code, 3)
            gp = GRADE_POINTS.get(grade, 0)
            total_attempted_credits += credits
            total_earned_points += gp * credits
            
    if total_attempted_credits == 0:
        return 0.0
    return round(total_earned_points / total_attempted_credits, 2)

@router.post("/calc-sgpa", response_model=SGPAComputationResponse)
async def calculate_sgpa_only(payload: SGPAComputationInput):
    credits_map = await get_subject_credits_map()
    grades_dict = {item.subject_code: item.grade for item in payload.grades}
    
    sgpa, total_credits, earned_credits, arrears = compute_sgpa_from_grades(grades_dict, credits_map)
    return SGPAComputationResponse(
        sgpa=sgpa,
        total_credits=total_credits,
        earned_credits=earned_credits,
        arrears=arrears
    )

@router.post("/submit", response_model=StudentResultResponse, status_code=status.HTTP_201_CREATED)
async def submit_student_result(
    payload: StudentResultSubmit,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    normalized_reg = payload.register_no.strip().upper()
    
    # 1. Edge case: Student not found
    student = await db.students.find_one({"register_no": normalized_reg})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    credits_map = await get_subject_credits_map()
    
    # 2. Edge case: Duplicate grade entry
    existing = await db.results.find_one({"register_no": normalized_reg, "semester": payload.semester})
    merged_grades = {}
    if existing:
        merged_grades = existing.get("grades", {})
    merged_grades.update(payload.grades)
    
    sgpa, total_credits, earned_credits, arrears = compute_sgpa_from_grades(merged_grades, credits_map)
    
    doc = {
        "register_no": normalized_reg,
        "student_name": payload.student_name.strip(),
        "section": payload.section.strip().upper(),
        "semester": payload.semester,
        "grades": merged_grades,
        "sgpa": sgpa,
        "total_credits": total_credits,
        "earned_credits": earned_credits,
        "arrears": arrears,
    }
    
    # Upsert result record for semester
    if existing:
        await db.results.update_one({"_id": existing["_id"]}, {"$set": doc})
        res_id = str(existing["_id"])
    else:
        inserted = await db.results.insert_one(doc)
        res_id = str(inserted.inserted_id)
        
    # Calculate exact multi-semester CGPA
    cgpa = await compute_cumulative_cgpa(normalized_reg, db)
    await db.results.update_one({"_id": existing["_id"] if existing else inserted.inserted_id}, {"$set": {"cgpa": cgpa}})
    
    # Also update student CGPA in students collection
    await db.students.update_one(
        {"register_no": normalized_reg},
        {"$set": {
            "name": payload.student_name.strip(),
            "section": payload.section.strip().upper(),
            "current_cgpa": cgpa
        }},
        upsert=True
    )

    return StudentResultResponse(
        id=res_id,
        register_no=normalized_reg,
        student_name=payload.student_name.strip(),
        section=payload.section.strip().upper(),
        semester=payload.semester,
        grades=merged_grades,
        sgpa=sgpa,
        cgpa=cgpa,
        arrears=arrears
    )

@router.post("/bulk", response_model=BulkGradeResponse)
async def bulk_upload_grades(
    payload: BulkGradeSubmit,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    credits_map = await get_subject_credits_map()
    inserted_or_updated = 0
    errors = []
    
    for item in payload.grades:
        normalized_reg = item.student_id.strip().upper()
        student = await db.students.find_one({"register_no": normalized_reg})
        if not student:
            errors.append({"student_id": item.student_id, "error": "Student not found"})
            continue
            
        existing = await db.results.find_one({"register_no": normalized_reg, "semester": payload.semester})
        
        merged_grades = {}
        if existing:
            merged_grades = existing.get("grades", {})
        
        merged_grades[payload.subject_code] = item.grade
        sgpa, total_credits, earned_credits, arrears = compute_sgpa_from_grades(merged_grades, credits_map)
        
        doc = {
            "register_no": normalized_reg,
            "student_name": student["name"],
            "section": student.get("section", "A"),
            "semester": payload.semester,
            "grades": merged_grades,
            "sgpa": sgpa,
            "total_credits": total_credits,
            "earned_credits": earned_credits,
            "arrears": arrears,
        }
        
        if existing:
            await db.results.update_one({"_id": existing["_id"]}, {"$set": doc})
        else:
            await db.results.insert_one(doc)
            
        cgpa = await compute_cumulative_cgpa(normalized_reg, db)
        await db.results.update_one({"register_no": normalized_reg, "semester": payload.semester}, {"$set": {"cgpa": cgpa}})
        
        await db.students.update_one(
            {"register_no": normalized_reg},
            {"$set": {
                "name": student["name"],
                "section": student.get("section", "A"),
                "current_cgpa": cgpa
            }}
        )
        inserted_or_updated += 1
        
    return BulkGradeResponse(inserted_or_updated=inserted_or_updated, errors=errors)

@router.get("/student/{register_no}", response_model=List[StudentResultResponse])
async def get_student_results(register_no: str):
    db = get_database()
    normalized_reg = register_no.strip().upper()
    cursor = db.results.find({"register_no": normalized_reg})
    results = []
    async for doc in cursor:
        results.append(StudentResultResponse(
            id=str(doc["_id"]),
            register_no=doc["register_no"],
            student_name=doc["student_name"],
            section=doc["section"],
            semester=doc["semester"],
            grades=doc["grades"],
            sgpa=doc["sgpa"],
            cgpa=doc.get("cgpa", doc["sgpa"]),
            arrears=doc.get("arrears", [])
        ))
    return results

@router.get("/section/{section}", response_model=List[StudentResultResponse])
async def get_section_results(section: str):
    db = get_database()
    normalized_sec = section.strip().upper()
    cursor = db.results.find({"section": normalized_sec}).sort("sgpa", -1)
    results = []
    rank = 1
    async for doc in cursor:
        results.append(StudentResultResponse(
            id=str(doc["_id"]),
            register_no=doc["register_no"],
            student_name=doc["student_name"],
            section=doc["section"],
            semester=doc["semester"],
            grades=doc["grades"],
            sgpa=doc["sgpa"],
            cgpa=doc.get("cgpa", doc["sgpa"]),
            arrears=doc.get("arrears", []),
            rank=rank
        ))
        rank += 1
    return results

@router.get("/leaderboard", response_model=List[StudentResultResponse])
async def get_leaderboard(
    limit: int = Query(10, ge=1, le=1000),
    semester: Optional[str] = Query(None)
):
    db = get_database()
    query: Dict[str, Any] = {"grades": {"$ne": {}}}
    if semester:
        query["semester"] = semester
    cursor = db.results.find(query).sort("sgpa", -1).limit(limit)
    leaderboard = []
    rank = 1
    async for doc in cursor:
        leaderboard.append(StudentResultResponse(
            id=str(doc["_id"]),
            register_no=doc["register_no"],
            student_name=doc["student_name"],
            section=doc["section"],
            semester=doc["semester"],
            grades=doc["grades"],
            sgpa=doc["sgpa"],
            cgpa=doc.get("cgpa", doc["sgpa"]),
            arrears=doc.get("arrears", []),
            rank=rank
        ))
        rank += 1
    return leaderboard

@router.get("/semester/{semester}/toppers", response_model=List[StudentResultResponse])
async def get_semester_toppers(semester: str, limit: int = Query(5, ge=1, le=100)):
    db = get_database()
    # Filter out empty grades to exclude students with no grades
    cursor = db.results.find({
        "semester": semester,
        "grades": {"$ne": {}}
    }).sort("sgpa", -1).limit(limit)
    
    toppers = []
    rank = 1
    async for doc in cursor:
        toppers.append(StudentResultResponse(
            id=str(doc["_id"]),
            register_no=doc["register_no"],
            student_name=doc["student_name"],
            section=doc["section"],
            semester=doc["semester"],
            grades=doc.get("grades", {}),
            sgpa=doc["sgpa"],
            cgpa=doc.get("cgpa", doc["sgpa"]),
            arrears=doc.get("arrears", []),
            rank=rank
        ))
        rank += 1
    return toppers

@router.get("/subject-stats/{subject_code}", response_model=SubjectStatsResponse)
async def get_subject_statistics(subject_code: str):
    db = get_database()
    code = subject_code.strip()
    cursor = db.results.find()
    
    total_appeared = 0
    passed = 0
    failed = 0
    grade_distribution = {"O": 0, "A+": 0, "A": 0, "B+": 0, "B": 0, "C": 0, "U": 0}
    arrear_students = []
    
    async for doc in cursor:
        grades = doc.get("grades", {})
        if code in grades:
            total_appeared += 1
            g = grades[code]
            if g in grade_distribution:
                grade_distribution[g] += 1
            if g == "U":
                failed += 1
                arrear_students.append(doc["register_no"])
            else:
                passed += 1
                
    pass_pct = round((passed / total_appeared * 100), 2) if total_appeared > 0 else 0.0
    return SubjectStatsResponse(
        subject_code=code,
        total_appeared=total_appeared,
        passed=passed,
        failed=failed,
        pass_percentage=pass_pct,
        grade_distribution=grade_distribution,
        arrear_students=arrear_students
    )

@router.get("/semester/{semester}/subject-analysis", response_model=List[SubjectStatsResponse])
async def get_semester_subject_analysis(semester: str):
    db = get_database()
    
    subjects_cursor = db.subjects.find({"semester": semester})
    subjects_list = []
    async for sub in subjects_cursor:
        subjects_list.append(sub)
        
    analysis = []
    for sub in subjects_list:
        code = sub["code"]
        cursor = db.results.find({"semester": semester})
        
        total_appeared = 0
        passed = 0
        failed = 0
        grade_distribution = {"O": 0, "A+": 0, "A": 0, "B+": 0, "B": 0, "C": 0, "U": 0}
        arrear_students = []
        
        async for doc in cursor:
            grades = doc.get("grades", {})
            if code in grades:
                total_appeared += 1
                g = grades[code]
                if g in grade_distribution:
                    grade_distribution[g] += 1
                if g == "U":
                    failed += 1
                    arrear_students.append(doc["register_no"])
                else:
                    passed += 1
                    
        pass_pct = round((passed / total_appeared * 100), 2) if total_appeared > 0 else 0.0
        analysis.append(SubjectStatsResponse(
            subject_code=code,
            total_appeared=total_appeared,
            passed=passed,
            failed=failed,
            pass_percentage=pass_pct,
            grade_distribution=grade_distribution,
            arrear_students=arrear_students
        ))
    return analysis

@router.get("/semester/{semester}/grade-distribution", response_model=Dict[str, int])
async def get_semester_grade_distribution(semester: str):
    db = get_database()
    cursor = db.results.find({"semester": semester})
    distribution = {"O": 0, "A+": 0, "A": 0, "B+": 0, "B": 0, "C": 0, "U": 0}
    
    async for doc in cursor:
        grades = doc.get("grades", {})
        for g in grades.values():
            if g in distribution:
                distribution[g] += 1
                
    return distribution
