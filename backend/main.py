import os
from contextlib import asynccontextmanager
# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware

try:
    from backend.database import connect_to_mongo, close_mongo_connection
    from backend.routers import auth, students, subjects, results
except ImportError:
    try:
        from database import connect_to_mongo, close_mongo_connection
        from routers import auth, students, subjects, results
    except ImportError:
        from .database import connect_to_mongo, close_mongo_connection
        from .routers import auth, students, subjects, results


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager to handle DB connection lifecycle."""
    print("[FastAPI] Starting application backend...")
    await connect_to_mongo()
    yield
    await close_mongo_connection()
    print("[FastAPI] Application shutdown complete.")

app = FastAPI(
    title="College Result Management & SGPA/CGPA API",
    description="FastAPI + MongoDB Atlas backend for Department Result Portal",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Wire routers (both with /api prefix and root prefix)
app.include_router(auth.router, prefix="/api")
app.include_router(students.router, prefix="/api")
app.include_router(subjects.router, prefix="/api")
app.include_router(results.router, prefix="/api")

app.include_router(auth.router)
app.include_router(students.router)
app.include_router(subjects.router)
app.include_router(results.router)

@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "ok",
        "name": "College Result Management & SGPA/CGPA API",
        "docs_url": "/docs",
        "openapi_url": "/openapi.json"
    }

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

