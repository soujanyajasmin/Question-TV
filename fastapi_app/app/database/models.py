from .database import get_connection

def create_questions_table():
    connection = get_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            question_number INTEGER NOT NULL,
            title TEXT NOT NULL,
            image TEXT,
            description TEXT NOT NULL
        )
    """)

    connection.commit()
    connection.close()

def insert_sample_questions():
    connection = get_connection()

    questions = [
        (
            "2026-09-25",
            1,
            "What is Artificial Intelligence?",
            "https://images.pexels.com/photos/8566467/pexels-photo-8566467.jpeg",
            "Artificial Intelligence is a field of computer science that focuses on creating systems that can perform tasks that normally require human intelligence."
        ),
        (
            "2026-09-25",
            2,
            "What is Machine Learning?",
            "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg",
            "Machine Learning is a part of Artificial Intelligence that allows computers to learn from data and make predictions or decisions."
        ),
        (
            "2026-09-25",
            3,
            "What is Cloud Computing?",
            "https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg",
            "Cloud Computing allows users to store data and use computing services through the internet."
        ),
        (
            "2026-09-25",
            4,
            "What is Internet of Things?",
            "https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg",
            "The Internet of Things connects physical devices to the internet so that they can collect and exchange data."
        ),
        (
            "2026-09-25",
            5,
            "What is Cyber Security?",
            "https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg",
            "Cyber Security is the practice of protecting computers, networks, applications, and data from cyber attacks."
        )
    ]

    connection.executemany("""
        INSERT INTO questions
        (date, question_number, title, image, description)
        VALUES (?, ?, ?, ?, ?)
    """, questions)

    connection.commit()
    connection.close()