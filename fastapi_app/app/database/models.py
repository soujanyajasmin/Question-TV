from .database import get_connection


def create_questions_table():

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            question_number INTEGER,
            title TEXT,
            image TEXT,
            description TEXT
        )
    """)

    connection.commit()

    connection.close()


def insert_sample_questions():

    connection = get_connection()

    cursor = connection.cursor()

    # Remove old sample data
    cursor.execute("DELETE FROM questions")

    questions = [

        (
            "2026-09-25",
            1,
            "Artificial Intelligence",
            "https://images.pexels.com/photos/8566467/pexels-photo-8566467.jpeg",
            "Artificial Intelligence is a field of computer science that focuses on creating systems that can perform tasks that normally require human intelligence."
        ),

        (
            "2026-09-25",
            2,
            "Machine Learning",
            "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg",
            "Machine Learning is a branch of artificial intelligence that allows computers to learn from data and make predictions or decisions."
        ),

        (
            "2026-09-25",
            3,
            "Cloud Computing",
            "https://images.pexels.com/photos/1181316/pexels-photo-1181316.jpeg",
            "Cloud Computing provides computing resources such as servers, storage and applications through the internet."
        ),

        (
            "2026-09-25",
            4,
            "Internet of Things",
            "https://images.pexels.com/photos/442150/pexels-photo-442150.jpeg",
            "The Internet of Things connects physical devices to the internet so they can collect, exchange and use data."
        ),

        (
            "2026-09-25",
            5,
            "Cyber Security",
            "https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg",
            "Cyber Security protects computers, networks, applications and data from unauthorized access and cyber threats."
        ),

        (
                "2026-09-25",
                6,
                "HTML",
                "https://images.pexels.com/photos/270404/pexels-photo-270404.jpeg",
                "HTML is the standard markup language used to create the structure of web pages."
            ),
    
            (
                "2026-09-25",
                7,
                "CSS",
                "https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg",
                "CSS is used to style and design the appearance of web pages."
            ),
    
            (
                "2026-09-25",
                8,
                "JavaScript",
                "https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg",
                "JavaScript is a programming language used to make web pages interactive."
            ),
    
            (
                "2026-09-25",
                9,
                "Python",
                "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg",
                "Python is a high-level programming language used for web development, data analysis, automation and many other applications."
            ),
    
            (
                "2026-09-25",
                10,
                "SQL",
                "https://images.pexels.com/photos/1108117/pexels-photo-1108117.jpeg",
                "SQL is a language used to store, retrieve and manage data in relational databases."
            )    

    ]

    cursor.executemany("""
        INSERT INTO questions
        (date, question_number, title, image, description)
        VALUES (?, ?, ?, ?, ?)
    """, questions)

    connection.commit()

    connection.close()

def insert_previous_month_questions():

    connection = get_connection()

    cursor = connection.cursor()

    # Remove existing previous month questions
    cursor.execute("""
        DELETE FROM questions
        WHERE date LIKE '2026-08%'
    """)

    questions = [

        (
            "2026-08-25",
            1,
            "What is Data Science?",
            "https://images.pexels.com/photos/669610/pexels-photo-669610.jpeg",
            "Data Science is the process of using data, statistics and programming to find useful information and insights."
        ),

        (
            "2026-08-25",
            2,
            "What is Deep Learning?",
            "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg",
            "Deep Learning is a part of machine learning that uses neural networks to learn from large amounts of data."
        ),

        (
            "2026-08-25",
            3,
            "What is a Database?",
            "https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg",
            "A database is an organized collection of data that can be stored, accessed and managed easily."
        ),

        (
            "2026-08-25",
            4,
            "What is an API?",
            "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg",
            "An API allows different software applications to communicate with each other and exchange data."
        ),

        (
            "2026-08-25",
            5,
            "What is FastAPI?",
            "https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg",
            "FastAPI is a Python web framework used to build fast and modern APIs."
        )

    ]

    cursor.executemany("""
        INSERT INTO questions
        (date, question_number, title, image, description)
        VALUES (?, ?, ?, ?, ?)
    """, questions)

    connection.commit()

    connection.close()

def insert_question(
    date,
    question_number,
    title,
    image,
    description
):

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO questions
        (date, question_number, title, image, description)
        VALUES (?, ?, ?, ?, ?)
    """, (
        date,
        question_number,
        title,
        image,
        description
    ))

    connection.commit()

    connection.close()