from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database.models import create_questions_table
from .routers.questions import router as questions_router


app = FastAPI()


# Allow frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


create_questions_table()

app.include_router(questions_router)


@app.get("/")
def home():
    return {"message": "Question TV API is running"}