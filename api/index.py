import sys
import os

# Add the project root to the python path so the backend package can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from backend.main import app
except Exception as e:
    import traceback
    err = traceback.format_exc()
    
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    app = FastAPI()
    
    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    async def catch_all(path: str):
        import os
        try:
            root_files = os.listdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        except:
            root_files = []
        return JSONResponse(status_code=500, content={
            "error_msg": str(e), 
            "traceback": err, 
            "sys_path": sys.path, 
            "cwd": os.getcwd(), 
            "cwd_files": os.listdir("."),
            "root_files": root_files
        })
