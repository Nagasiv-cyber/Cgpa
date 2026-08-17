from fastapi import APIRouter, HTTPException, status, Depends
from typing import List

try:
    from backend.database import get_database
    from backend.auth_utils import get_current_user
    from backend.schemas import AuditLogResponse
except ImportError:
    try:
        from database import get_database
        from auth_utils import get_current_user
        from schemas import AuditLogResponse
    except ImportError:
        from ..database import get_database
        from ..auth_utils import get_current_user
        from ..schemas import AuditLogResponse

router = APIRouter(prefix="/audit", tags=["Audit"])

@router.get("/", response_model=List[AuditLogResponse])
async def get_audit_logs(limit: int = 100, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view audit logs"
        )
    
    db = get_database()
    # Sort by timestamp descending
    cursor = db.audit_logs.find().sort("timestamp", -1).limit(limit)
    logs = []
    async for doc in cursor:
        logs.append(
            AuditLogResponse(
                id=str(doc["_id"]),
                user_id=doc["user_id"],
                email=doc["email"],
                role=doc["role"],
                ip_address=doc.get("ip_address"),
                user_agent=doc.get("user_agent"),
                timestamp=doc["timestamp"]
            )
        )
    return logs
