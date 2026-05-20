import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.authorize import router as authorize_router

load_dotenv()

DEFAULT_ORIGINS = "http://localhost:5173"
allowed_origins = [
    o.strip()
    for o in os.environ.get("ALLOWED_ORIGINS", DEFAULT_ORIGINS).split(",")
    if o.strip()
]

app = FastAPI(title="Prior Auth Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(authorize_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
