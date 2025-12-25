import uvicorn
import os

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    print(f"🚀 Starting Anton Protocol server on {host}:{port}")
    uvicorn.run("server:app", host=host, port=port, reload=True)
