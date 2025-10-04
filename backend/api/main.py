from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ..config import settings
from .routes import router

app: FastAPI = FastAPI(
    title=settings.title,
    version=settings.version,
    contact={
        "name": settings.contact_name,
        "email": settings.contact_email,
    },
    openapi_url=None if not settings.environment.docs_available() else "/openapi.json",
)

app.include_router(router)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    