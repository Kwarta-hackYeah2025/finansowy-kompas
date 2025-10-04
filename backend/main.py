from api.main import app

# Optional: allow running with `python -m uvicorn backend.main:app --reload`
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
