from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.models import create_questions_table, insert_previous_month_questions
from app.routers import questions


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize table structure and seed September archive data
    create_questions_table()
    insert_previous_month_questions()
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