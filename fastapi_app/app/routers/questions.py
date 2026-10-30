from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.database.database import get_connection

router = APIRouter()


class QuestionSchema(BaseModel):
    date: Optional[str] = str(date.today())
    question_number: Optional[int] = 1
    title: Optional[str] = "Untitled News"
    category: Optional[str] = "National"
    language: Optional[str] = "en"
    author: Optional[str] = "Question TV News Desk"
    image: Optional[str] = ""
    description: Optional[str] = ""
    live_video: Optional[str] = ""
    is_premium: Optional[bool] = False


def ensure_columns(cursor):
    cursor.execute("PRAGMA table_info(questions)")
    columns = [column[1] for column in cursor.fetchall()]
    if "language" not in columns:
        cursor.execute("ALTER TABLE questions ADD COLUMN language TEXT DEFAULT 'en'")
    if "author" not in columns:
        cursor.execute("ALTER TABLE questions ADD COLUMN author TEXT DEFAULT 'Question TV News Desk'")
    if "live_video" not in columns:
        cursor.execute("ALTER TABLE questions ADD COLUMN live_video TEXT DEFAULT ''")
    if "is_premium" not in columns:
        cursor.execute("ALTER TABLE questions ADD COLUMN is_premium BOOLEAN DEFAULT 0")
    
    cursor.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_date_num_lang 
        ON questions(date, question_number, language)
    """)


def normalize_language(lang: Optional[str]) -> str:
    if not lang:
        return "en"
    l_lower = lang.lower()
    if "te" in l_lower or "తెలుగు" in lang:
        return "te"
    if "hi" in l_lower or "हिन्दी" in lang or "hindi" in l_lower:
        return "hi"
    return "en"


@router.get("/questions/next-number")
def get_next_question_number(
    selected_date: str = Query(...), 
    language: Optional[str] = Query("en")
):
    lang_code = normalize_language(language)
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT MAX(question_number)
        FROM questions
        WHERE date = ? AND language = ?
    """, (selected_date, lang_code))

    row = cursor.fetchone()
    connection.close()

    max_num = row[0] if row and row[0] is not None else 0
    return {"next_question_number": max_num + 1}


@router.get("/questions/related/{category}")
def get_related_stories(category: str, exclude_id: int = Query(0), language: Optional[str] = Query("en")):
    connection = get_connection()
    cursor = connection.cursor()
    ensure_columns(cursor)
    lang_code = normalize_language(language)

    cursor.execute("""
        SELECT id, date, question_number, title, category, language, author, image, description, live_video, is_premium
        FROM questions
        WHERE category = ? AND language = ? AND id != ?
        ORDER BY id DESC
        LIMIT 4
    """, (category, lang_code, exclude_id))
    rows = cursor.fetchall()

    if not rows:
        cursor.execute("""
            SELECT id, date, question_number, title, category, language, author, image, description, live_video, is_premium
            FROM questions
            WHERE language = ? AND id != ?
            ORDER BY id DESC
            LIMIT 4
        """, (lang_code, exclude_id))
        rows = cursor.fetchall()

    connection.close()
    return [dict(row) for row in rows]


@router.get("/questions")
def get_questions(selected_date: Optional[str] = Query(None)):
    connection = get_connection()
    cursor = connection.cursor()
    ensure_columns(cursor)

    target_date = selected_date if selected_date else date.today().isoformat()

    cursor.execute("""
        SELECT
            id, date, question_number, title, category, language, author, image, description, live_video, is_premium
        FROM questions
        WHERE date = ?
        ORDER BY question_number ASC
    """, (target_date,))

    questions = cursor.fetchall()
    
    if not questions and not selected_date:
        cursor.execute("""
            SELECT DISTINCT date FROM questions ORDER BY date DESC LIMIT 1
        """)
        latest_date_row = cursor.fetchone()
        if latest_date_row:
            target_date = latest_date_row["date"]
            cursor.execute("""
                SELECT
                    id, date, question_number, title, category, language, author, image, description, live_video, is_premium
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
            "language": normalize_language(q_dict.get("language")),
            "author": q_dict.get("author") or "Question TV News Desk",
            "image": q_dict.get("image", ""),
            "description": q_dict.get("description", ""),
            "live_video": q_dict.get("live_video", ""),
            "is_premium": bool(q_dict.get("is_premium", False))
        })

    return result


@router.get("/questions/previous-month")
def get_previous_month_questions(target_month: Optional[str] = Query(None)):
    connection = get_connection()
    cursor = connection.cursor()
    ensure_columns(cursor)

    if not target_month:
        today = date.today()
        first_day_current_month = today.replace(day=1)
        last_day_prev_month = first_day_current_month - timedelta(days=1)
        target_month = last_day_prev_month.strftime("%Y-%m")

    cursor.execute("""
        SELECT
            id, date, question_number, title, category, language, author, image, description, live_video, is_premium
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
            "language": normalize_language(q_dict.get("language")),
            "author": q_dict.get("author") or "Question TV News Desk",
            "image": q_dict.get("image", ""),
            "description": q_dict.get("description", ""),
            "live_video": q_dict.get("live_video", ""),
            "is_premium": bool(q_dict.get("is_premium", False))
        })

    return result


@router.post("/questions")
def create_question(payload: QuestionSchema):
    connection = get_connection()
    cursor = connection.cursor()
    ensure_columns(cursor)

    lang_code = normalize_language(payload.language)

    try:
        cursor.execute("""
            INSERT INTO questions (date, question_number, title, category, language, author, image, description, live_video, is_premium)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(date, question_number, language) DO UPDATE SET
                title = EXCLUDED.title,
                category = EXCLUDED.category,
                author = EXCLUDED.author,
                image = EXCLUDED.image,
                description = EXCLUDED.description,
                live_video = EXCLUDED.live_video,
                is_premium = EXCLUDED.is_premium
        """, (payload.date, payload.question_number, payload.title, payload.category, lang_code, payload.author, payload.image, payload.description, payload.live_video, 1 if payload.is_premium else 0))

        connection.commit()
        new_id = cursor.lastrowid
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=400, detail=f"Database error: {str(e)}")
    finally:
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