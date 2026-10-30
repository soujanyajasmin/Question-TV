from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import init_db
from app.routers import questions


@asynccontextmanager
async def lifespan(app: FastAPI):
    #initialize database tables, migrations, and sample data on startup
    init_db()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(questions.router)


@app.get("/")
def read_root():
    return {"status": "ok", "message": "Question TV API is running successfully!"}