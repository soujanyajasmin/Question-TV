import os
import sqlite3

BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
DATABASE_NAME = os.path.join(BASE_DIR, "question_tv.db")


def get_connection():
    connection = sqlite3.connect(DATABASE_NAME, timeout=30.0)
    connection.row_factory = sqlite3.Row
    return connection


def create_questions_table():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='questions'")
    row = cursor.fetchone()

    if row and row["sql"] and "UNIQUE(date, question_number)" in row["sql"]:
        cursor.execute("ALTER TABLE questions RENAME TO old_questions")
        cursor.execute("""
            CREATE TABLE questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                question_number INTEGER NOT NULL,
                title TEXT,
                category TEXT DEFAULT 'National',
                language TEXT DEFAULT 'en',
                author TEXT DEFAULT 'Question TV News Desk',
                image TEXT,
                description TEXT,
                live_video TEXT DEFAULT ''
            )
        """)
        cursor.execute("""
            INSERT INTO questions (id, date, question_number, title, category, language, author, image, description, live_video)
            SELECT id, date, question_number, title, category, COALESCE(language, 'en'), COALESCE(author, 'Question TV News Desk'), image, description, ''
            FROM old_questions
        """)
        cursor.execute("DROP TABLE old_questions")
    else:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                question_number INTEGER NOT NULL,
                title TEXT,
                category TEXT DEFAULT 'National',
                language TEXT DEFAULT 'en',
                author TEXT DEFAULT 'Question TV News Desk',
                image TEXT,
                description TEXT,
                live_video TEXT DEFAULT ''
            )
        """)

    cursor.execute("PRAGMA table_info(questions)")
    columns = [column[1] for column in cursor.fetchall()]
    if "live_video" not in columns:
        cursor.execute("ALTER TABLE questions ADD COLUMN live_video TEXT DEFAULT ''")

    cursor.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_date_num_lang 
        ON questions(date, question_number, language)
    """)

    connection.commit()
    connection.close()


def insert_sample_questions():
    pass


def insert_previous_month_questions():
    connection = get_connection()
    cursor = connection.cursor()

    previous_questions = [
        (
            "2026-09-25", 1,
            "TECH & AI: OpenAI Unveils Agentic AI Framework for Enterprise Automation",
            "Tech", "en", "Question TV News Desk",
            "https://images.pexels.com/photos/433308/pexels-photo-433308.jpeg",
            "SAN FRANCISCO — OpenAI has officially released its next-generation agentic artificial intelligence tools aimed at enterprise users.",
            ""
        ),
        (
            "2026-09-25", 2,
            "MARKETS: Global Markets Rally as Central Banks Signal Interest Rate Pause",
            "National", "en", "Question TV News Desk",
            "https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg",
            "MUMBAI — Benchmark stock indices surged in early trade following global cues after key central banks signaled an upcoming pause on rate hikes.",
            ""
        ),
        (
            "2026-09-25", 3,
            "CYBER SECURITY: Critical Zero-Day Vulnerability Patched in Enterprise Systems",
            "Tech", "en", "Question TV News Desk",
            "https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg",
            "NEW DELHI — Cybersecurity agencies have issued an urgent patch advisory following the discovery of a high-severity zero-day exploit.",
            ""
        ),
        (
            "2026-09-25", 4,
            "CLOUD COMPUTING: Cloud Infrastructure Spending Surges 22% in Q3",
            "Tech", "en", "Question TV News Desk",
            "https://images.pexels.com/photos/1181316/pexels-photo-1181316.jpeg",
            "BENGALURU — Global enterprise cloud infrastructure expenditure reached new highs this quarter, driven by heavy investment in AI.",
            ""
        ),
        (
            "2026-09-25", 5,
            "STARTUPS: High-Tech Manufacturing Startups Raise $1.2B in Funding",
            "Tech", "en", "Question TV News Desk",
            "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg",
            "HYDERABAD — Venture capital funding into deep-tech and semiconductor hardware startups saw a massive resurgence this month.",
            ""
        ),
        (
            "2026-09-25", 6,
            "TELECOM: Next-Gen 6G Research Initiative Unveiled by Telecom Giants",
            "Tech", "en", "Question TV News Desk",
            "https://images.pexels.com/photos/442150/pexels-photo-442150.jpeg",
            "SEOUL — Leading telecommunication conglomerates have announced a joint consortium to establish global standards for 6G wireless networks.",
            ""
        ),
        (
            "2026-09-25", 7,
            "ECONOMY: India's Manufacturing PMI Touches 18-Month High in September",
            "National", "en", "Question TV News Desk",
            "https://images.pexels.com/photos/669610/pexels-photo-669610.jpeg",
            "MUMBAI — Robust demand and expanding export orders pushed India's manufacturing purchasing managers' index (PMI) to an 18-month high.",
            ""
        ),
        (
            "2026-09-25", 8,
            "EV SECTOR: Battery Swapping Policy Expansion Boosts Urban EV Adoption",
            "National", "en", "Question TV News Desk",
            "https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg",
            "BENGALURU — The rollout of standardized battery-swapping stations across metropolitan hubs has driven a sharp increase in EV sales.",
            ""
        ),
        (
            "2026-09-25", 9,
            "ENTERTAINMENT: Digital Streaming Platforms Announce Major Tech Integration",
            "Entertainment", "en", "Question TV News Desk",
            "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg",
            "SAN JOSE — Major streaming networks are introducing interactive entertainment features and AI-driven personalized recommendations.",
            ""
        ),
        (
            "2026-09-25", 10,
            "SPORTS: Sports Analytics and Wearable Tech Adoption Doubles in Pro Leagues",
            "Sports", "en", "Question TV News Desk",
            "https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg",
            "LONDON — Professional athletic franchises are heavily adopting real-time telemetry and data analytics to optimize performance.",
            ""
        )
    ]

    cursor.executemany("""
        INSERT OR REPLACE INTO questions
        (date, question_number, title, category, language, author, image, description, live_video)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, previous_questions)

    connection.commit()
    connection.close()


def init_db():
    create_questions_table()
    insert_sample_questions()
    insert_previous_month_questions()