# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Dict, Optional, Literal, Any

# --- Auth Schemas ---
class UserRegister(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=6)
    role: Literal["faculty", "admin", "student"] = "faculty"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    email: EmailStr
    name: str
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# --- Subject Schemas ---
class SubjectBase(BaseModel):
    code: str = Field(..., min_length=3, max_length=20)
    name: str
    abbr: str
    credits: int = Field(ge=0, le=10)
    faculty: str
    semester: Optional[str] = None

class SubjectCreate(SubjectBase):
    pass

class SubjectResponse(SubjectBase):
    model_config = ConfigDict(from_attributes=True)
    id: Optional[str] = None

# --- Grade & Result Schemas ---
GradeCode = Literal["O", "A+", "A", "B+", "B", "C", "U"]

GRADE_POINTS: Dict[GradeCode, int] = {
    "O": 10,
    "A+": 9,
    "A": 8,
    "B+": 7,
    "B": 6,
    "C": 5,
    "U": 0,
}

class SubjectGradeInput(BaseModel):
    subject_code: str
    grade: GradeCode

class SGPAComputationInput(BaseModel):
    grades: List[SubjectGradeInput]

class SGPAComputationResponse(BaseModel):
    sgpa: float
    total_credits: int
    earned_credits: int
    arrears: List[str]

class StudentResultSubmit(BaseModel):
    register_no: str = Field(..., min_length=3)
    student_name: str
    section: Literal["A", "B", "C", "D"]
    semester: str
    grades: Dict[str, GradeCode]  # key: subject_code, value: grade

class StudentResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    register_no: str
    student_name: str
    section: str
    semester: str
    grades: Dict[str, GradeCode]
    sgpa: float
    cgpa: float
    arrears: List[str]
    rank: Optional[int] = None

class SubjectStatsResponse(BaseModel):
    subject_code: str
    total_appeared: int
    passed: int
    failed: int
    pass_percentage: float
    grade_distribution: Dict[str, int]
    arrear_students: List[str]

class BulkGradeItem(BaseModel):
    student_id: str
    grade: GradeCode

class BulkGradeSubmit(BaseModel):
    subject_code: str
    semester: str
    academic_year: str
    grades: List[BulkGradeItem]
    
class BulkGradeResponse(BaseModel):
    inserted_or_updated: int
    errors: List[Dict[str, str]]

# --- Student Schemas ---
class StudentBase(BaseModel):
    register_no: str = Field(..., min_length=3)
    name: str
    section: Optional[str] = "A"
    department: Optional[str] = "AIML"
    batch: Optional[str] = "2022-2026"
    email: Optional[EmailStr] = None

class StudentCreate(StudentBase):
    pass

class StudentResponse(StudentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    current_cgpa: Optional[float] = 0.0
    current_semester: Optional[int] = None
    sgpa_this_semester: Optional[float] = None
    cgpa_all_semesters: Optional[float] = None

