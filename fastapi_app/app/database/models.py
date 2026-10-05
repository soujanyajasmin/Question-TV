from datetime import date, timedelta
from .database import get_connection


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

    connection.commit()
    connection.close()


def insert_previous_month_questions():
    """Populates 10 news stories for September (Previous Month) with ET/Mint style data."""
    connection = get_connection()
    cursor = connection.cursor()

    today = date.today()
    first_day_this_month = date(today.year, today.month, 1)
    last_day_prev_month = first_day_this_month - timedelta(days=1)
    prev_month_str = last_day_prev_month.strftime("%Y-%m")
    september_date = f"{prev_month_str}-25"

    news_segments = [
        (
            september_date, 1, 
            "TECH & AI: OpenAI Unveils Agentic AI Framework for Enterprise Automation", 
            "Tech",
            "https://images.pexels.com/photos/8566467/pexels-photo-8566467.jpeg", 
            "SAN FRANCISCO — OpenAI has officially released its next-generation agentic artificial intelligence tools aimed at enterprise users. The framework enables autonomous AI agents to execute multi-step workflows, manage cloud databases, and handle customer service workflows with human-in-the-loop oversight."
        ),
        (
            september_date, 2, 
            "MARKETS: Global Markets Rally as Central Banks Signal Interest Rate Pause", 
            "National",
            "https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg", 
            "MUMBAI — Benchmark stock indices surged in early trade following global cues after key central banks signaled an upcoming pause on rate hikes. Tech and banking stocks led the gains, boosting market capitalisation across major exchanges."
        ),
        (
            september_date, 3, 
            "CYBER SECURITY: Critical Zero-Day Vulnerability Patched in Enterprise Systems", 
            "Tech",
            "https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg", 
            "NEW DELHI — Cybersecurity agencies have issued an urgent patch advisory following the discovery of a high-severity zero-day exploit targeting enterprise cloud infrastructure. Security operations teams are urged to apply immediate updates to safeguard sensitive network data."
        ),
        (
            september_date, 4, 
            "CLOUD COMPUTING: Cloud Infrastructure Spending Surges 22% in Q3", 
            "Tech",
            "https://images.pexels.com/photos/1181316/pexels-photo-1181316.jpeg", 
            "BENGALURU — Global enterprise cloud infrastructure expenditure reached new highs this quarter, driven by heavy investment in generative AI infrastructure, hybrid cloud migrations, and edge computing deployment across financial sectors."
        ),
        (
            september_date, 5, 
            "STARTUPS: High-Tech Manufacturing Startups Raise $1.2B in Funding", 
            "Tech",
            "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg", 
            "HYDERABAD — Venture capital funding into deep-tech and semiconductor hardware startups saw a massive resurgence this month. Investors are doubling down on local chip design, green energy grid solutions, and autonomous robotics."
        ),
        (
            september_date, 6, 
            "TELECOM: Next-Gen 6G Research Initiative Unveiled by Telecom Giants", 
            "Tech",
            "https://images.pexels.com/photos/442150/pexels-photo-442150.jpeg", 
            "SEOUL — Leading telecommunication conglomerates have announced a joint consortium to establish global standards for 6G wireless networks, aiming for sub-terahertz speeds and near-zero latency by the end of the decade."
        ),
        (
            september_date, 7, 
            "ECONOMY: India's Manufacturing PMI Touches 18-Month High in September", 
            "National",
            "https://images.pexels.com/photos/669610/pexels-photo-669610.jpeg", 
            "MUMBAI — Robust demand and expanding export orders pushed India's manufacturing purchasing managers' index (PMI) to its highest point in 18 months, pointing to continued resilience across key industrial sectors."
        ),
        (
            september_date, 8, 
            "EV SECTOR: Battery Swapping Policy Expansion Boosts Urban EV Adoption", 
            "National",
            "https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg", 
            "BENGALURU — The rollout of standardized battery-swapping stations across metropolitan hubs has driven a sharp increase in two-wheeler and commercial electric vehicle sales, addressing long-standing range anxiety concerns."
        ),
        (
            september_date, 9, 
            "ENTERTAINMENT: Digital Streaming Platforms Announce Major Tech Integration", 
            "Entertainment",
            "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg", 
            "SAN JOSE — Major streaming networks are introducing interactive entertainment features and AI-driven personalized recommendations to maximize user retention."
        ),
        (
            september_date, 10, 
            "SPORTS: Sports Analytics and Wearable Tech Adoption Doubles in Pro Leagues", 
            "Sports",
            "https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg", 
            "LONDON — Professional athletic franchises are heavily adopting real-time telemetry and data analytics to optimize performance and prevent player injury."
        )
    ]

    cursor.executemany("""
        INSERT INTO questions
        (date, question_number, title, category, image, description)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(date, question_number) DO NOTHING
    """, news_segments)

    connection.commit()
    connection.close()


def insert_question(date, question_number, title, category, image, description):
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
    """, (date, question_number, title, category, image, description))

    connection.commit()
    connection.close()