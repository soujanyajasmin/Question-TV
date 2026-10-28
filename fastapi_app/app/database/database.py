import os
import sqlite3

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
            language TEXT DEFAULT 'en',
            author TEXT DEFAULT 'Question TV News Desk',
            image TEXT,
            description TEXT,
            UNIQUE(date, question_number)
        )
    """)

    cursor.execute("PRAGMA table_info(questions)")
    columns = [column[1] for column in cursor.fetchall()]
    if "category" not in columns:
        cursor.execute("ALTER TABLE questions ADD COLUMN category TEXT DEFAULT 'National'")
    if "language" not in columns:
        cursor.execute("ALTER TABLE questions ADD COLUMN language TEXT DEFAULT 'en'")
    if "author" not in columns:
        cursor.execute("ALTER TABLE questions ADD COLUMN author TEXT DEFAULT 'Question TV News Desk'")

    connection.commit()
    connection.close()


def insert_sample_questions():
    connection = get_connection()
    cursor = connection.cursor()

    today_str = "2026-10-28"

    todays_questions = [
        (
            today_str, 1, 
            "Global Summit on Clean Energy Transitions Opens in Geneva", 
            "World", "en", "Question TV News Desk",
            "https://images.pexels.com/photos/433308/pexels-photo-433308.jpeg", 
            "GENEVA — Delegates from over 100 countries convened today to accelerate the adoption of solar, wind, and next-generation hydrogen fuel infrastructure."
        ),
        (
            today_str, 2, 
            "Breakthrough in Fusion Energy Reactor Achieves Net Power Gain", 
            "Tech", "en", "Question TV News Desk",
            "https://images.pexels.com/photos/256381/pexels-photo-256381.jpeg", 
            "OXFORD — Physicists announced a major milestone in magnetic confinement fusion, producing sustained thermal energy that paves the way for clean baseload power."
        ),
        (
            today_str, 3, 
            "Stock Markets Close Higher Following Robust Retail Earnings", 
            "Business", "en", "Question TV News Desk",
            "https://images.pexels.com/photos/186461/pexels-photo-186461.jpeg", 
            "NEW YORK — Major stock indices rallied today as strong quarterly financial reports from retail and consumer goods sectors eased recession concerns."
        ),
        (
            today_str, 4, 
            "National Infrastructure Board Approves High-Speed Freight Corridor", 
            "National", "en", "Question TV News Desk",
            "https://images.pexels.com/photos/163726/belgium-antwerp-shipping-container-163726.jpeg", 
            "NEW DELHI — The newly approved rail corridor aims to cut cargo transit times between industrial manufacturing hubs by nearly 50 percent."
        ),
        (
            today_str, 5, 
            "Autonomous Electric Shuttles Begin Public Trials in Metropolitan Zones", 
            "Local", "en", "Question TV News Desk",
            "https://images.pexels.com/photos/3764984/pexels-photo-3764984.jpeg", 
            "BENGALURU — Commuters can now experience self-driving public transport vehicles equipped with advanced LiDAR mapping and real-time pedestrian safety sensors."
        ),
        (
            today_str, 6, 
            "International Film Festival Announces Lineup for Virtual Reality Cinema", 
            "Entertainment", "en", "Question TV News Desk",
            "https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg", 
            "LOS ANGELES — Directors and digital artists are showcasing immersive 360-degree storytelling formats, transforming how audiences experience narrative films."
        ),
        (
            today_str, 7, 
            "National Cricket Squad Unveils Final Lineup for Upcoming Series", 
            "Sports", "en", "Question TV News Desk",
            "https://images.pexels.com/photos/262524/pexels-photo-262524.jpeg", 
            "MUMBAI — Selectors have named an exciting mix of veteran leaders and rising domestic talents for the upcoming international test series."
        ),
        (
            today_str, 8, 
            "Cybersecurity Alliance Releases Zero-Trust Framework for Enterprises", 
            "Tech", "en", "Question TV News Desk",
            "https://images.pexels.com/photos/5380664/pexels-photo-5380664.jpeg", 
            "SAN JOSE — The new guidelines mandate continuous identity verification and micro-segmentation to protect corporate cloud assets from advanced persistent threats."
        ),
        (
            today_str, 9, 
            "National Space Agency Schedules Next Satellite Launch Window", 
            "National", "en", "Question TV News Desk",
            "https://images.pexels.com/photos/586056/pexels-photo-586056.jpeg", 
            "SRIHARIKOTA — Preparations are in final stages for launching a multi-spectral Earth observation satellite designed to track climate patterns and coastal erosion."
        )
    ]

    cursor.executemany("""
        INSERT OR REPLACE INTO questions
        (date, question_number, title, category, language, author, image, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, todays_questions)

    connection.commit()
    connection.close()


def insert_previous_month_questions():
    connection = get_connection()
    cursor = connection.cursor()

    previous_questions = [
        (
            "2026-09-25", 1,
            "TECH & AI: OpenAI Unveils Agentic AI Framework for Enterprise Automation",
            "Tech", "en", "Question TV News Desk",
            "https://images.pexels.com/photos/433308/pexels-photo-433308.jpeg",
            "SAN FRANCISCO — OpenAI has officially released its next-generation agentic artificial intelligence tools aimed at enterprise users. The framework enables autonomous AI agents to execute multi-step workflows, manage cloud databases, and handle customer service workflows with human-in-the-loop oversight."
        ),
        (
            "2026-09-25", 2,
            "MARKETS: Global Markets Rally as Central Banks Signal Interest Rate Pause",
            "National", "en", "Question TV News Desk",
            "https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg",
            "MUMBAI — Benchmark stock indices surged in early trade following global cues after key central banks signaled an upcoming pause on rate hikes. Tech and banking stocks led the gains, boosting market capitalisation across major exchanges."
        ),
        (
            "2026-09-25", 3,
            "CYBER SECURITY: Critical Zero-Day Vulnerability Patched in Enterprise Systems",
            "Tech", "en", "Question TV News Desk",
            "https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg",
            "NEW DELHI — Cybersecurity agencies have issued an urgent patch advisory following the discovery of a high-severity zero-day exploit targeting enterprise cloud infrastructure. Security operations teams are urged to apply immediate updates to safeguard sensitive network data."
        ),
        (
            "2026-09-25", 4,
            "CLOUD COMPUTING: Cloud Infrastructure Spending Surges 22% in Q3",
            "Tech", "en", "Question TV News Desk",
            "https://images.pexels.com/photos/1181316/pexels-photo-1181316.jpeg",
            "BENGALURU — Global enterprise cloud infrastructure expenditure reached new highs this quarter, driven by heavy investment in generative AI infrastructure, hybrid cloud migrations, and edge computing deployment across financial sectors."
        ),
        (
            "2026-09-25", 5,
            "STARTUPS: High-Tech Manufacturing Startups Raise $1.2B in Funding",
            "Tech", "en", "Question TV News Desk",
            "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg",
            "HYDERABAD — Venture capital funding into deep-tech and semiconductor hardware startups saw a massive resurgence this month. Investors are doubling down on local chip design, green energy grid solutions, and autonomous robotics."
        ),
        (
            "2026-09-25", 6,
            "TELECOM: Next-Gen 6G Research Initiative Unveiled by Telecom Giants",
            "Tech", "en", "Question TV News Desk",
            "https://images.pexels.com/photos/442150/pexels-photo-442150.jpeg",
            "SEOUL — Leading telecommunication conglomerates have announced a joint consortium to establish global standards for 6G wireless networks, aiming for sub-terahertz speeds and near-zero latency by the end of the decade."
        ),
        (
            "2026-09-25", 7,
            "ECONOMY: India's Manufacturing PMI Touches 18-Month High in September",
            "National", "en", "Question TV News Desk",
            "https://images.pexels.com/photos/669610/pexels-photo-669610.jpeg",
            "MUMBAI — Robust demand and expanding export orders pushed India's manufacturing purchasing managers' index (PMI) to its highest point in 18 months, pointing to continued resilience across key industrial sectors."
        ),
        (
            "2026-09-25", 8,
            "EV SECTOR: Battery Swapping Policy Expansion Boosts Urban EV Adoption",
            "National", "en", "Question TV News Desk",
            "https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg",
            "BENGALURU — The rollout of standardized battery-swapping stations across metropolitan hubs has driven a sharp increase in two-wheeler and commercial electric vehicle sales, addressing long-standing range anxiety concerns."
        ),
        (
            "2026-09-25", 9,
            "ENTERTAINMENT: Digital Streaming Platforms Announce Major Tech Integration",
            "Entertainment", "en", "Question TV News Desk",
            "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg",
            "SAN JOSE — Major streaming networks are introducing interactive entertainment features and AI-driven personalized recommendations to maximize user retention."
        ),
        (
            "2026-09-25", 10,
            "SPORTS: Sports Analytics and Wearable Tech Adoption Doubles in Pro Leagues",
            "Sports", "en", "Question TV News Desk",
            "https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg",
            "LONDON — Professional athletic franchises are heavily adopting real-time telemetry and data analytics to optimize performance and prevent player injury."
        )
    ]

    cursor.executemany("""
        INSERT OR REPLACE INTO questions
        (date, question_number, title, category, language, author, image, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, previous_questions)

    connection.commit()
    connection.close()


def init_db():
    create_questions_table()
    insert_sample_questions()
    insert_previous_month_questions()