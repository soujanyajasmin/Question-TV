from fastapi import APIRouter
from ..database.database import get_connection

router = APIRouter()


@router.get("/questions")
def get_questions():

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            id,
            date,
            question_number,
            title,
            image,
            description
        FROM questions
        ORDER BY question_number
    """)

    questions = cursor.fetchall()

    connection.close()

    result = []

    for question in questions:
        result.append({
            "id": question["id"],
            "date": question["date"],
            "question_number": question["question_number"],
            "title": question["title"],
            "image": question["image"],
            "description": question["description"]
        })

    return result

@router.get("/questions/previous-month")
def get_previous_month_questions():

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            id,
            date,
            question_number,
            title,
            image,
            description
        FROM questions
        WHERE date LIKE '2026-08%'
        ORDER BY question_number
    """)

    questions = cursor.fetchall()

    connection.close()

    result = []

    for question in questions:
        result.append({
            "id": question["id"],
            "date": question["date"],
            "question_number": question["question_number"],
            "title": question["title"],
            "image": question["image"],
            "description": question["description"]
        })

    return result