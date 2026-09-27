import sqlite3
import os


# Find the main Question-TV folder
BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..")
)

# Use the database in the main Question-TV folder
DATABASE_NAME = os.path.join(
    BASE_DIR,
    "question_tv.db"
)


def get_connection():

    connection = sqlite3.connect(DATABASE_NAME)

    connection.row_factory = sqlite3.Row

    return connection