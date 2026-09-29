from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import init_db
from app.routers import questions


# Modern lifespan handler for app startup/shutdown tasks
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database tables and default data on app startup
    init_db()
    yield


app = FastAPI(lifespan=lifespan)

# Allowed domains that can make requests to this backend
origins = [
    "https://question-tv.vercel.app",  # Your production Vercel frontend
    "http://127.0.0.1:5500",           # Local development (Live Server)
    "http://localhost:5500",
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,             # Restrict to specified frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(questions.router)


@app.get("/")
def read_root():
    return {"status": "ok", "message": "Question TV API is running successfully!"}