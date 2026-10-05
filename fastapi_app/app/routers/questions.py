from datetime import date
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.database.database import get_connection

router = APIRouter()


class QuestionSchema(BaseModel):
    date: str
    question_number: int
    title: str
    category: Optional[str] = "National"
    image: str
    description: str


@router.get("/questions/next-number")
def get_next_question_number(selected_date: str = Query(...)):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT MAX(question_number)
        FROM questions
        WHERE date = ?
    """, (selected_date,))

    row = cursor.fetchone()
    connection.close()

    max_num = row[0] if row and row[0] is not None else 0
    return {"next_question_number": max_num + 1}


@router.get("/questions")
def get_questions():
    connection = get_connection()
    cursor = connection.cursor()

    current_date = date.today().strftime("%Y-%m-%d")

    cursor.execute("""
        SELECT
            id,
            date,
            question_number,
            title,
            category,
            image,
            description
        FROM questions
        WHERE date = ?
        ORDER BY question_number ASC
    """, (current_date,))

    questions = cursor.fetchall()
    connection.close()

    result = []
    for question in questions:
        result.append({
            "id": question["id"],
            "date": question["date"],
            "question_number": question["question_number"],
            "title": question["title"],
            "category": question["category"] if question["category"] else "National",
            "image": question["image"],
            "description": question["description"]
        })

    return result


@router.get("/questions/previous-month")
def get_previous_month_questions():
    connection = get_connection()
    cursor = connection.cursor()

    current_year = date.today().year
    current_month = date.today().month

    if current_month == 1:
        previous_year = current_year - 1
        previous_month = 12
    else:
        previous_year = current_year
        previous_month = current_month - 1

    previous_month_string = f"{previous_year:04d}-{previous_month:02d}"

    cursor.execute("""
        SELECT
            id,
            date,
            question_number,
            title,
            category,
            image,
            description
        FROM questions
        WHERE date LIKE ?
        ORDER BY date ASC, question_number ASC
    """, (previous_month_string + "%",))

    questions = cursor.fetchall()
    connection.close()

    result = []
    for question in questions:
        result.append({
            "id": question["id"],
            "date": question["date"],
            "question_number": question["question_number"],
            "title": question["title"],
            "category": question["category"] if question["category"] else "National",
            "image": question["image"],
            "description": question["description"]
        })

    return result


@router.post("/questions")
def create_question(payload: QuestionSchema):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO questions (date, question_number, title, category, image, description)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(date, question_number) DO UPDATE SET
            title = EXCLUDED.title,
            category = EXCLUDED.category,
            image = EXCLUDED.image,
            description = EXCLUDED.description
    """, (payload.date, payload.question_number, payload.title, payload.category, payload.image, payload.description))

    connection.commit()
    new_id = cursor.lastrowid
    connection.close()

    return {"message": "Question saved successfully", "id": new_id}


@router.delete("/questions/{question_id}")
def delete_question(question_id: int):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("DELETE FROM questions WHERE id = ?", (question_id,))
    connection.commit()
    rows_affected = cursor.rowcount
    connection.close()

    if rows_affected == 0:
        raise HTTPException(status_code=404, detail="Question not found")

    return {"message": "Question deleted successfully"}