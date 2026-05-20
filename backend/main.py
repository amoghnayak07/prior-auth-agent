from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.authorize import router as authorize_router

load_dotenv()

app = FastAPI(title="Prior Auth Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(authorize_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
