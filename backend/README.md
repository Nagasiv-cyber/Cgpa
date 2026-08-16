# College Result Management & SGPA/CGPA Backend (FastAPI + MongoDB Atlas)

FastAPI async backend service for calculating SGPA/CGPA, managing student grade records, subjects, and authentication.

## Project Structure
- `main.py` - FastAPI application entry point, lifecycle manager, CORS middleware & router inclusion.
- `database.py` - MongoDB Atlas async connection setup via `Motor`.
- `auth_utils.py` - JWT authentication, password hashing (`passlib` + `bcrypt`), and current user dependency.
- `schemas.py` - Pydantic v2 data models for requests and responses.
- `routers/`
  - `auth.py` - User register, login, and user profile (`/auth`)
  - `students.py` - Student CRUD operations (`/students`)
  - `subjects.py` - Subject management and auto-seeding (`/subjects`)
  - `results.py` - SGPA calculation and result submissions (`/results`)

## Setup & Execution

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Variables
Copy `.env.example` to `.env` and set your MongoDB Atlas connection string:
```bash
cp .env.example .env
```

### 3. Run FastAPI Server
```bash
uvicorn main:app --reload --port 8000
```
Interactive API documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
