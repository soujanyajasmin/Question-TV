// =====================================
// API CONFIGURATION
// =====================================

// Automatically uses your production backend when deployed, or fallback to localhost during local testing
const PROD_BACKEND_URL = "https://your-backend-service.onrender.com"; // Replace with your deployed backend URL

const BASE_URL = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
    ? "http://127.0.0.1:8000"
    : PROD_BACKEND_URL;

const API_URL = `${BASE_URL}/questions`;
const PREVIOUS_MONTH_API_URL = `${BASE_URL}/questions/previous-month`;

// =====================================
// DOM ELEMENTS
// =====================================

const activeBucket = document.getElementById("activeBucket");
const contentHeading = document.getElementById("contentHeading");
const contentImage = document.getElementById("contentImage");
const contentDescription = document.getElementById("contentDescription");
const nextButton = document.getElementById("nextButton");
const previousButton = document.getElementById("previousButton");
const previousMonthButton = document.getElementById("previousMonthButton");
const previousMonthText = document.getElementById("previousMonthText");
const sectionTitle = document.getElementById("sectionTitle");
const currentDayButton = document.getElementById("currentDayButton");
const addQuestionForm = document.getElementById("addQuestionForm");
const deleteQuestionButton = document.getElementById("deleteQuestionButton");
const questionCounter = document.getElementById("questionCounter");

const qDateInput = document.getElementById("qDate");
const qNumberInput = document.getElementById("qNumber");

// Set default form date to today
if (qDateInput) {
    qDateInput.value = new Date().toISOString().split("T")[0];
}

// =====================================
// STATE MANAGEMENT
// =====================================

let questions = [];
let previousQuestions = [];
let currentIndex = 0;
let previousIndex = 0;
let viewingPreviousMonth = false;

// =====================================
// AUTO-FETCH NEXT QUESTION NUMBER
// =====================================

async function fetchNextQuestionNumber() {
    if (!qDateInput || !qNumberInput) return;

    const selectedDate = qDateInput.value;
    if (!selectedDate) return;

    try {
        const response = await fetch(`${API_URL}/next-number?selected_date=${selectedDate}`);
        if (!response.ok) {
            throw new Error("Failed to fetch next question number");
        }

        const data = await response.json();
        if (data.next_question_number !== undefined) {
            qNumberInput.value = data.next_question_number;
        }
    } catch (error) {
        console.error("Error fetching next question number:", error);
    }
}

// Re-calculate question number whenever the user changes the form date
if (qDateInput) {
    qDateInput.addEventListener("change", fetchNextQuestionNumber);
}

// =====================================
// GET PREVIOUS MONTH NAME
// =====================================

function getPreviousMonthName() {
    const today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth();

    if (month === 0) {
        year--;
        month = 11;
    } else {
        month--;
    }

    return new Date(year, month, 1).toLocaleString("en-US", { month: "long" });
}

// =====================================
// FETCH CURRENT DAY QUESTIONS
// =====================================

async function loadQuestions() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to fetch current questions");
        }

        questions = await response.json();
        console.log("Current questions:", questions);

        if (Array.isArray(questions) && questions.length > 0) {
            currentIndex = 0;
            displayCurrentQuestion();
        } else if (contentHeading && contentDescription) {
            contentHeading.textContent = "No questions found";
            contentDescription.textContent = "No questions available for today.";
            if (contentImage) contentImage.src = "";
            if (activeBucket) activeBucket.textContent = "Question 0";
            if (questionCounter) questionCounter.textContent = "";
        }
    } catch (error) {
        console.error("Error loading current questions:", error);
        if (contentHeading && contentDescription) {
            contentHeading.textContent = "Unable to load questions";
            contentDescription.textContent = "Please make sure FastAPI backend is running.";
        }
    }
}

// =====================================
// DISPLAY CURRENT DAY QUESTION
// =====================================

function displayCurrentQuestion() {
    if (questions.length === 0) {
        if (questionCounter) questionCounter.textContent = "";
        return;
    }

    const current = questions[currentIndex];
    const num = current.question_number || (currentIndex + 1);

    if (activeBucket) activeBucket.textContent = `Question ${num}`;
    if (contentHeading) contentHeading.textContent = current.title || `Question ${num}`;
    if (contentImage) {
        contentImage.src = current.image || "";
        contentImage.alt = current.title || "Question image";
    }
    if (contentDescription) contentDescription.textContent = current.description || "";

    if (questionCounter) {
        questionCounter.textContent = `Question ${currentIndex + 1} of ${questions.length}`;
    }
}

// =====================================
// DISPLAY PREVIOUS MONTH QUESTION
// =====================================

function displayPreviousMonthQuestion() {
    if (previousQuestions.length === 0) {
        if (questionCounter) questionCounter.textContent = "";
        return;
    }

    const current = previousQuestions[previousIndex];
    const num = current.question_number || (previousIndex + 1);

    if (activeBucket) activeBucket.textContent = `Question ${num}`;
    if (contentHeading) contentHeading.textContent = current.title || `Question ${num}`;
    if (contentImage) {
        contentImage.src = current.image || "";
        contentImage.alt = current.title || "Question image";
    }
    if (contentDescription) contentDescription.textContent = current.description || "";

    if (questionCounter) {
        questionCounter.textContent = `Question ${previousIndex + 1} of ${previousQuestions.length}`;
    }
}

// =====================================
// NEXT BUTTON
// =====================================

if (nextButton) {
    nextButton.addEventListener("click", function () {
        if (viewingPreviousMonth) {
            if (previousQuestions.length === 0) return;
            previousIndex = (previousIndex + 1) % previousQuestions.length;
            displayPreviousMonthQuestion();
            return;
        }

        if (questions.length === 0) return;
        currentIndex = (currentIndex + 1) % questions.length;
        displayCurrentQuestion();
    });
}

// =====================================
// PREVIOUS BUTTON
// =====================================

if (previousButton) {
    previousButton.addEventListener("click", function () {
        if (viewingPreviousMonth) {
            if (previousQuestions.length === 0) return;
            previousIndex = (previousIndex - 1 + previousQuestions.length) % previousQuestions.length;
            displayPreviousMonthQuestion();
            return;
        }

        if (questions.length === 0) return;
        currentIndex = (currentIndex - 1 + questions.length) % questions.length;
        displayCurrentQuestion();
    });
}

// =====================================
// PREVIOUS MONTH
// =====================================

if (previousMonthButton) {
    previousMonthButton.addEventListener("click", async function () {
        try {
            const response = await fetch(PREVIOUS_MONTH_API_URL);

            if (!response.ok) {
                throw new Error("Previous month API error");
            }

            previousQuestions = await response.json();
            console.log("Previous month questions:", previousQuestions);

            if (previousQuestions.length === 0) {
                if (previousMonthText) previousMonthText.textContent = "No previous month data found.";
                return;
            }

            viewingPreviousMonth = true;
            previousIndex = 0;

            const monthName = getPreviousMonthName();

            if (sectionTitle) sectionTitle.textContent = `Previous Month - ${monthName}`;
            if (currentDayButton) currentDayButton.style.display = "inline-block";
            if (previousMonthText) previousMonthText.textContent = `${previousQuestions.length} questions available`;

            displayPreviousMonthQuestion();
        } catch (error) {
            console.error("Error loading previous month data:", error);
            if (previousMonthText) previousMonthText.textContent = "Unable to load previous month data.";
        }
    });
}

// =====================================
// RETURN TO CURRENT DAY
// =====================================

if (currentDayButton) {
    currentDayButton.addEventListener("click", function () {
        viewingPreviousMonth = false;
        currentIndex = 0;

        if (sectionTitle) sectionTitle.textContent = "Current Day";
        currentDayButton.style.display = "none";

        displayCurrentQuestion();
    });
}

// =====================================
// CREATE QUESTION (POST)
// =====================================

if (addQuestionForm) {
    addQuestionForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const payload = {
            date: document.getElementById("qDate").value,
            question_number: parseInt(document.getElementById("qNumber").value),
            title: document.getElementById("qTitle").value,
            image: document.getElementById("qImage").value,
            description: document.getElementById("qDescription").value
        };

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error("Failed to create question");
            }

            alert("Question added successfully!");
            addQuestionForm.reset();

            // Reset default date to today and auto-fetch the updated next question number
            if (qDateInput) qDateInput.value = new Date().toISOString().split("T")[0];
            await fetchNextQuestionNumber();

            if (!viewingPreviousMonth) {
                await loadQuestions();
            }
        } catch (error) {
            console.error("Error creating question:", error);
            alert("Failed to create question.");
        }
    });
}

// =====================================
// DELETE QUESTION (DELETE)
// =====================================

if (deleteQuestionButton) {
    deleteQuestionButton.addEventListener("click", async function () {
        const targetList = viewingPreviousMonth ? previousQuestions : questions;
        const targetIndex = viewingPreviousMonth ? previousIndex : currentIndex;

        if (targetList.length === 0) return;

        const currentQuestion = targetList[targetIndex];
        const confirmDelete = confirm(`Are you sure you want to delete "${currentQuestion.title}"?`);

        if (!confirmDelete) return;

        try {
            const response = await fetch(`${API_URL}/${currentQuestion.id}`, {
                method: "DELETE"
            });

            if (!response.ok) {
                throw new Error("Failed to delete question");
            }

            alert("Question deleted successfully!");

            if (viewingPreviousMonth) {
                const prevResponse = await fetch(PREVIOUS_MONTH_API_URL);
                previousQuestions = await prevResponse.json();
                previousIndex = 0;
                if (previousQuestions.length > 0) {
                    displayPreviousMonthQuestion();
                } else {
                    if (contentHeading) contentHeading.textContent = "No previous month questions remaining.";
                    if (questionCounter) questionCounter.textContent = "";
                }
            } else {
                await loadQuestions();
            }

            // Refresh auto-number in form after deletion
            await fetchNextQuestionNumber();
        } catch (error) {
            console.error("Error deleting question:", error);
            alert("Failed to delete question.");
        }
    });
}

// =====================================
// INITIALIZE PAGE
// =====================================

if (currentDayButton) currentDayButton.style.display = "none";
loadQuestions();
fetchNextQuestionNumber();