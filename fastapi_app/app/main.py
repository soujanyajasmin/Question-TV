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

# CORS Middleware configured to allow access across devices and cloud frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any origin/device
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(questions.router)


@app.get("/")
def read_root():
    return {"status": "ok", "message": "Question TV API is running successfully!"}