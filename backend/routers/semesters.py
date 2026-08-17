# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List

try:
    from backend.database import get_database
    from backend.schemas import SemesterCreate, SemesterResponse
    from backend.auth_utils import get_current_user
except ImportError:
    try:
        from database import get_database
        from schemas import SemesterCreate, SemesterResponse
        from auth_utils import get_current_user
    except ImportError:
        from ..database import get_database
        from ..schemas import SemesterCreate, SemesterResponse
        from ..auth_utils import get_current_user

router = APIRouter(prefix="/semesters", tags=["Semesters"])

@router.get("/", response_model=List[SemesterResponse])
async def list_semesters():
    db = get_database()
    semesters = []
    cursor = db.semesters.find().sort("value", 1)
    async for doc in cursor:
        semesters.append(SemesterResponse(
            id=str(doc["_id"]),
            value=doc["value"],
            label=doc["label"]
        ))
    
    # If no semesters exist, return default fallback
    if not semesters:
        return [
            SemesterResponse(id="default-1", value="1", label="I Semester"),
            SemesterResponse(id="default-2", value="2", label="II Semester")
        ]
        
    return semesters

@router.post("/", response_model=SemesterResponse, status_code=status.HTTP_201_CREATED)
async def create_semester(
    semester: SemesterCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    
    # Check if value already exists
    existing = await db.semesters.find_one({"value": semester.value.strip()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Semester with value '{semester.value}' already exists"
        )
        
    doc = {
        "value": semester.value.strip(),
        "label": semester.label.strip()
    }
    
    result = await db.semesters.insert_one(doc)
    
    return SemesterResponse(
        id=str(result.inserted_id),
        value=doc["value"],
        label=doc["label"]
    )
