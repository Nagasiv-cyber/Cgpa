# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List

try:
    from backend.database import get_database
    from backend.schemas import SubjectCreate, SubjectResponse
    from backend.auth_utils import get_current_user
except ImportError:
    try:
        from database import get_database
        from schemas import SubjectCreate, SubjectResponse
        from auth_utils import get_current_user
    except ImportError:
        from ..database import get_database
        from ..schemas import SubjectCreate, SubjectResponse
        from ..auth_utils import get_current_user


router = APIRouter(prefix="/subjects", tags=["Subjects"])

DEFAULT_SUBJECTS = [
    {"code": "AD19643", "name": "Innovation & Design Thinking", "abbr": "IDT", "credits": 4, "faculty": "Dr. S. Kavitha"},
    {"code": "24NCS08", "name": "Deep Learning Architectures", "abbr": "DLA", "credits": 4, "faculty": "Prof. R. Manikandan"},
    {"code": "AD19651", "name": "Natural Language Processing", "abbr": "NLP", "credits": 3, "faculty": "Dr. P. Anitha"},
    {"code": "AD19662", "name": "Big Data Analytics", "abbr": "BDA", "credits": 3, "faculty": "Prof. V. Sathish"},
    {"code": "CS19671", "name": "Cloud & Edge Computing", "abbr": "CEC", "credits": 3, "faculty": "Dr. M. Lakshmi"},
    {"code": "AD19681", "name": "AI Systems Laboratory", "abbr": "AIL", "credits": 2, "faculty": "Prof. K. Deepa"},
]

@router.get("/", response_model=List[SubjectResponse])
async def list_subjects():
    db = get_database()
    subjects = []
    cursor = db.subjects.find()
    async for doc in cursor:
        subjects.append(SubjectResponse(
            id=str(doc["_id"]),
            code=doc["code"],
            name=doc["name"],
            abbr=doc["abbr"],
            credits=doc["credits"],
            faculty=doc["faculty"],
            semester=doc.get("semester")
        ))
    
    # Auto seed defaults if collection is empty
    if not subjects:
        for sub in DEFAULT_SUBJECTS:
            res = await db.subjects.insert_one(sub)
            subjects.append(SubjectResponse(
                id=str(res.inserted_id),
                **sub
            ))
            
    return subjects

@router.post("/", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
async def create_subject(
    subject: SubjectCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    existing = await db.subjects.find_one({"code": subject.code})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Subject with code '{subject.code}' already exists"
        )
    
    doc = subject.model_dump()
    result = await db.subjects.insert_one(doc)
    return SubjectResponse(id=str(result.inserted_id), **doc)

@router.delete("/{subject_code}", status_code=status.HTTP_200_OK)
async def delete_subject(
    subject_code: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    result = await db.subjects.delete_one({"code": subject_code})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subject not found")
    return {"message": "Subject deleted successfully"}
