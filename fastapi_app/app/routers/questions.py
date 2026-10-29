from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.database.database import get_connection

router = APIRouter()


class QuestionSchema(BaseModel):
    date: str
    question_number: int
    title: str
    category: Optional[str] = "National"
    language: Optional[str] = "en"
    author: Optional[str] = "Question TV News Desk"
    image: str
    description: str


def ensure_columns(cursor):
    cursor.execute("PRAGMA table_info(questions)")
    columns = [column[1] for column in cursor.fetchall()]
    if "language" not in columns:
        cursor.execute("ALTER TABLE questions ADD COLUMN language TEXT DEFAULT 'en'")
    if "author" not in columns:
        cursor.execute("ALTER TABLE questions ADD COLUMN author TEXT DEFAULT 'Question TV News Desk'")


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
def get_questions(selected_date: Optional[str] = Query(None)):
    connection = get_connection()
    cursor = connection.cursor()
    ensure_columns(cursor)

    # If no specific date is requested, default to today's live date or latest available date
    target_date = selected_date if selected_date else date.today().isoformat()

    cursor.execute("""
        SELECT
            id,
            date,
            question_number,
            title,
            category,
            language,
            author,
            image,
            description
        FROM questions
        WHERE date = ?
        ORDER BY question_number ASC
    """, (target_date,))

    questions = cursor.fetchall()
    
    # Fallback: if no stories exist for today yet, fetch the most recent date available in the DB
    if not questions and not selected_date:
        cursor.execute("""
            SELECT DISTINCT date FROM questions ORDER BY date DESC LIMIT 1
        """)
        latest_date_row = cursor.fetchone()
        if latest_date_row:
            target_date = latest_date_row["date"]
            cursor.execute("""
                SELECT
                    id, date, question_number, title, category, language, author, image, description
                FROM questions
                WHERE date = ?
                ORDER BY question_number ASC
            """, (target_date,))
            questions = cursor.fetchall()

    connection.close()

    result = []
    for question in questions:
        q_dict = dict(question)
        result.append({
            "id": q_dict.get("id"),
            "date": q_dict.get("date"),
            "question_number": q_dict.get("question_number"),
            "title": q_dict.get("title"),
            "category": q_dict.get("category") or "National",
            "language": q_dict.get("language") or "en",
            "author": q_dict.get("author") or "Question TV News Desk",
            "image": q_dict.get("image", ""),
            "description": q_dict.get("description", "")
        })

    return result


@router.get("/questions/previous-month")
def get_previous_month_questions(target_month: Optional[str] = Query(None)):
    connection = get_connection()
    cursor = connection.cursor()
    ensure_columns(cursor)

    # Dynamically compute the previous month if not explicitly provided
    if not target_month:
        today = date.today()
        first_day_current_month = today.replace(day=1)
        last_day_prev_month = first_day_current_month - timedelta(days=1)
        target_month = last_day_prev_month.strftime("%Y-%m")

    cursor.execute("""
        SELECT
            id,
            date,
            question_number,
            title,
            category,
            language,
            author,
            image,
            description
        FROM questions
        WHERE date LIKE ?
        ORDER BY date DESC, question_number ASC
    """, (target_month + "%",))

    questions = cursor.fetchall()
    connection.close()

    result = []
    for question in questions:
        q_dict = dict(question)
        result.append({
            "id": q_dict.get("id"),
            "date": q_dict.get("date"),
            "question_number": q_dict.get("question_number"),
            "title": q_dict.get("title"),
            "category": q_dict.get("category") or "National",
            "language": q_dict.get("language") or "en",
            "author": q_dict.get("author") or "Question TV News Desk",
            "image": q_dict.get("image", ""),
            "description": q_dict.get("description", "")
        })

    return result


@router.post("/questions")
def create_question(payload: QuestionSchema):
    connection = get_connection()
    cursor = connection.cursor()
    ensure_columns(cursor)

    cursor.execute("""
        INSERT INTO questions (date, question_number, title, category, language, author, image, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(date, question_number) DO UPDATE SET
            title = EXCLUDED.title,
            category = EXCLUDED.category,
            language = EXCLUDED.language,
            author = EXCLUDED.author,
            image = EXCLUDED.image,
            description = EXCLUDED.description
    """, (payload.date, payload.question_number, payload.title, payload.category, payload.language, payload.author, payload.image, payload.description))

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