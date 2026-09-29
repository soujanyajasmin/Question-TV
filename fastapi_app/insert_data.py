from app.database.models import insert_question


questions = [

    (
        "2026-09-29",
        11,
        "What is Flask?",
        "https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg",
        "Flask is a Python web framework used to build web applications."
    ),

    (
        "2026-09-29",
        12,
        "What is FastAPI?",
        "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg",
        "FastAPI is a Python web framework used to build fast and modern APIs."
    ),

    (
        "2026-09-29",
        13,
        "What is SQLite?",
        "https://images.pexels.com/photos/1109541/pexels-photo-1109541.jpeg",
        "SQLite is a lightweight database system that stores data in a single database file."
    )

]


for question in questions:

    insert_question(
        question[0],
        question[1],
        question[2],
        question[3],
        question[4]
    )


print("Questions inserted successfully")