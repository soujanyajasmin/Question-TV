import os
import sqlite3
from datetime import date, timedelta

BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
DATABASE_NAME = os.path.join(BASE_DIR, "question_tv.db")


def get_connection():
    connection = sqlite3.connect(DATABASE_NAME)
    connection.row_factory = sqlite3.Row
    return connection


def create_questions_table():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            question_number INTEGER NOT NULL,
            title TEXT,
            category TEXT DEFAULT 'National',
            image TEXT,
            description TEXT,
            UNIQUE(date, question_number)
        )
    """)

    # Ensure existing database instances migrate the category column dynamically
    cursor.execute("PRAGMA table_info(questions)")
    columns = [column[1] for column in cursor.fetchall()]
    if "category" not in columns:
        cursor.execute("ALTER TABLE questions ADD COLUMN category TEXT DEFAULT 'National'")

    connection.commit()
    connection.close()


def insert_sample_questions():
    connection = get_connection()
    cursor = connection.cursor()

    today_str = date.today().strftime("%Y-%m-%d")

    questions = [
        (today_str, 1, "Artificial Intelligence", "Tech", "https://images.pexels.com/photos/8566467/pexels-photo-8566467.jpeg", "Artificial Intelligence focuses on creating systems that perform tasks requiring human intelligence."),
        (today_str, 2, "Machine Learning", "Tech", "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg", "Machine Learning enables computers to learn from data and make predictions or decisions."),
        (today_str, 3, "Cloud Computing", "Tech", "https://images.pexels.com/photos/1181316/pexels-photo-1181316.jpeg", "Cloud Computing delivers computing services including servers, storage, databases, and software over the internet."),
        (today_str, 4, "Internet of Things", "Tech", "https://images.pexels.com/photos/442150/pexels-photo-442150.jpeg", "The Internet of Things connects everyday physical objects to the internet to collect and exchange data."),
        (today_str, 5, "Cyber Security", "Tech", "https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg", "Cyber Security protects systems, networks, and applications from digital attacks and unauthorized access."),
        (today_str, 6, "DevOps", "Tech", "https://images.pexels.com/photos/577585/pexels-photo-577585.jpeg", "DevOps combines software development and IT operations to shorten the systems development life cycle."),
        (today_str, 7, "Blockchain", "Tech", "https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg", "Blockchain is a decentralized, distributed ledger technology that records transactions securely across computers."),
        (today_str, 8, "Big Data Analytics", "Tech", "https://images.pexels.com/photos/669610/pexels-photo-669610.jpeg", "Big Data Analytics examines large sets of data to uncover hidden patterns, correlations, and business trends."),
        (today_str, 9, "Quantum Computing", "Tech", "https://images.pexels.com/photos/256381/pexels-photo-256381.jpeg", "Quantum Computing uses principles of quantum mechanics to solve complex computational problems exponentially faster."),
        (today_str, 10, "Computer Vision", "Tech", "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg", "Computer Vision enables computers and systems to derive meaningful information from digital images and videos.")
    ]

    cursor.executemany("""
        INSERT OR REPLACE INTO questions
        (date, question_number, title, category, image, description)
        VALUES (?, ?, ?, ?, ?, ?)
    """, questions)

    connection.commit()
    connection.close()


def insert_previous_month_questions():
    connection = get_connection()
    cursor = connection.cursor()

    today = date.today()
    first_day_this_month = date(today.year, today.month, 1)
    last_day_prev_month = first_day_this_month - timedelta(days=1)
    prev_month_str = last_day_prev_month.strftime("%Y-%m")
    sample_date = f"{prev_month_str}-15"

    questions = [
        (sample_date, 1, "What is Data Science?", "Tech", "https://images.pexels.com/photos/669610/pexels-photo-669610.jpeg", "Data Science combines math, statistics, and programming to extract actionable insights from data."),
        (sample_date, 2, "What is Deep Learning?", "Tech", "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg", "Deep Learning is a subset of machine learning based on artificial neural networks with representation learning."),
        (sample_date, 3, "What is a Database?", "Tech", "https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg", "A database is an organized collection of structured information or data stored electronically in a computer system."),
        (sample_date, 4, "What is Web Development?", "Tech", "https://images.pexels.com/photos/270404/pexels-photo-270404.jpeg", "Web Development involves creating, building, and maintaining websites and web applications for the internet."),
        (sample_date, 5, "What is Mobile App Development?", "Tech", "https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg", "Mobile App Development is the process of creating software applications that run on mobile devices.")
    ]

    cursor.executemany("""
        INSERT OR REPLACE INTO questions
        (date, question_number, title, category, image, description)
        VALUES (?, ?, ?, ?, ?, ?)
    """, questions)

    connection.commit()
    connection.close()


def init_db():
    create_questions_table()
    
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute("SELECT COUNT(*) FROM questions")
    count = cursor.fetchone()[0]
    connection.close()

    if count == 0:
        insert_sample_questions()
        insert_previous_month_questions()