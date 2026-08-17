# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional

try:
    from backend.database import get_database
    from backend.schemas import StudentCreate, StudentResponse
    from backend.auth_utils import get_current_user
except ImportError:
    try:
        from database import get_database
        from schemas import StudentCreate, StudentResponse
        from auth_utils import get_current_user
    except ImportError:
        from ..database import get_database
        from ..schemas import StudentCreate, StudentResponse
        from ..auth_utils import get_current_user


router = APIRouter(prefix="/students", tags=["Students"])

@router.get("/", response_model=List[StudentResponse])
async def list_students(
    section: Optional[str] = Query(None, description="Filter by section A, B, C, or D")
):
    db = get_database()
    query = {}
    if section:
        query["section"] = section.strip().upper()
    
    students_docs = await db.students.find(query).to_list(length=None)
    
    # Fetch all relevant results in one query to avoid N+1 problem
    reg_nos = [doc["register_no"] for doc in students_docs]
    results_cursor = db.results.find({"register_no": {"$in": reg_nos}})
    results_map = {}
    async for res in results_cursor:
        reg = res["register_no"]
        sem = str(res.get("semester", ""))
        results_map[(reg, sem)] = res
    
    students = []
    for doc in students_docs:
        reg_no = doc["register_no"]
        current_sem = doc.get("current_semester", 6)
        
        # Look up result from the pre-fetched map
        res_doc = results_map.get((reg_no, str(current_sem)))
        sgpa = res_doc.get("sgpa") if res_doc else None
        
        students.append(StudentResponse(
            id=str(doc["_id"]),
            register_no=reg_no,
            name=doc["name"],
            section=doc.get("section", "A"),
            department=doc.get("department", "AIML"),
            batch=doc.get("batch", "2022-2026"),
            email=doc.get("email"),
            current_cgpa=doc.get("current_cgpa", 0.0),
            current_semester=current_sem,
            sgpa_this_semester=sgpa,
            cgpa_all_semesters=doc.get("current_cgpa", 0.0)
        ))
    return students

@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    student: StudentCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    normalized_reg = student.register_no.strip().upper()
    
    existing = await db.students.find_one({"register_no": normalized_reg})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Student with Register No '{normalized_reg}' already exists"
        )
    
    doc = {
        "register_no": normalized_reg,
        "name": student.name.strip(),
        "section": student.section.strip().upper() if student.section else "A",
        "department": student.department.strip() if student.department else "AIML",
        "batch": student.batch.strip() if student.batch else "2022-2026",
        "email": student.email.strip().lower() if student.email else None,
        "current_cgpa": 0.0
    }
    result = await db.students.insert_one(doc)
    
    return StudentResponse(
        id=str(result.inserted_id),
        register_no=normalized_reg,
        name=student.name.strip(),
        section=doc["section"],
        department=doc["department"],
        batch=doc["batch"],
        email=doc["email"],
        current_cgpa=0.0
    )

@router.get("/{register_no}", response_model=StudentResponse)
async def get_student(
    register_no: str
):
    db = get_database()
    normalized_reg = register_no.strip().upper()
    doc = await db.students.find_one({"register_no": normalized_reg})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student '{normalized_reg}' not found"
        )
    
    reg_no = doc["register_no"]
    current_sem = doc.get("current_semester", 6)
    
    res_doc = await db.results.find_one({"register_no": reg_no, "semester": str(current_sem)})
    sgpa = res_doc.get("sgpa") if res_doc else None
    
    return StudentResponse(
        id=str(doc["_id"]),
        register_no=reg_no,
        name=doc["name"],
        section=doc.get("section", "A"),
        department=doc.get("department", "AIML"),
        batch=doc.get("batch", "2022-2026"),
        email=doc.get("email"),
        current_cgpa=doc.get("current_cgpa", 0.0),
        current_semester=current_sem,
        sgpa_this_semester=sgpa,
        cgpa_all_semesters=doc.get("current_cgpa", 0.0)
    )

@router.delete("/{register_no}", status_code=status.HTTP_200_OK)
async def delete_student(
    register_no: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    normalized_reg = register_no.strip().upper()
    res = await db.students.delete_one({"register_no": normalized_reg})
    if res.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student '{normalized_reg}' not found"
        )
    # Also cleanup student results
    await db.results.delete_many({"register_no": normalized_reg})
    return {"message": f"Student '{normalized_reg}' and associated records deleted successfully"}


