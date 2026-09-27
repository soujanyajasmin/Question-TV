// =====================================
// API CONFIGURATION
// =====================================
const API_URL = "http://127.0.0.1:8000/questions";

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

// =====================================
// STATE MANAGEMENT
// =====================================
let questions = [];
let currentIndex = 0;

// =====================================
// FETCH DATA FROM FASTAPI
// =====================================
async function loadQuestions() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to fetch questions from API");
        }

        questions = await response.json();

        if (Array.isArray(questions) && questions.length > 0) {
            currentIndex = 0;
            displayCurrentQuestion();
        }
    } catch (error) {
        console.error("Error loading questions:", error);
        contentHeading.textContent = "Unable to load questions";
        contentDescription.textContent = "Please ensure your FastAPI backend is running on http://127.0.0.1:8000.";
    }
}

// =====================================
// UPDATE DISPLAYED QUESTION
// =====================================
function displayCurrentQuestion() {
    if (questions.length === 0) return;

    const current = questions[currentIndex];

    // Update Oval Button Text (e.g., Question 1, Question 2 ... Question 10)
    const num = current.question_number || (currentIndex + 1);
    activeBucket.textContent = `Question ${num}`;

    // Update Title, Image, and Description
    contentHeading.textContent = current.title || `Question ${num}`;
    contentImage.src = current.image || "";
    contentImage.alt = current.title || "Question image";
    contentDescription.textContent = current.description || "";
}

// =====================================
// NAVIGATION HANDLERS
// =====================================
if (nextButton) {
    nextButton.addEventListener("click", () => {
        if (questions.length === 0) return;

        // Advance to next item, looping back to start when reaching the end
        currentIndex = (currentIndex + 1) % questions.length;
        displayCurrentQuestion();
    });
}

if (previousButton) {
    previousButton.addEventListener("click", () => {
        if (questions.length === 0) return;

        // Move to previous item, wrapping to the end if at start
        currentIndex = (currentIndex - 1 + questions.length) % questions.length;
        displayCurrentQuestion();
    });
}

// Initialize on page load
loadQuestions();

// =====================================
// PREVIOUS MONTH
// =====================================

let previousMonthQuestions = [];
let previousMonthIndex = 0;

if (previousMonthButton) {

    previousMonthButton.addEventListener("click", async function() {

        try {

            const response =
                await fetch("http://127.0.0.1:8000/questions/previous-month");

            if (!response.ok) {
                throw new Error("Previous month API error");
            }

            previousMonthQuestions = await response.json();

            console.log(
                "Previous month questions:",
                previousMonthQuestions
            );

            if (previousMonthQuestions.length === 0) {

                previousMonthText.textContent =
                    "No previous month data found.";

                return;
            }

            previousMonthText.textContent =
                previousMonthQuestions.length +
                " questions available";

            // Change section title
            sectionTitle.textContent =
                "Previous Month - August";

            // Start from Question 1
            previousMonthIndex = 0;

            // Display first August question
            displayPreviousMonthQuestion();

        } catch (error) {

            console.error(
                "Error loading previous month data:",
                error
            );

            previousMonthText.textContent =
                "Unable to load previous month data.";
        }

    });
}

function displayPreviousMonthQuestion() {

    if (previousMonthQuestions.length === 0) {
        return;
    }

    const current =
        previousMonthQuestions[previousMonthIndex];

    const num =
        current.question_number ||
        (previousMonthIndex + 1);

    activeBucket.textContent =
        `Question ${num}`;

    contentHeading.textContent =
        current.title ||
        `Question ${num}`;

    contentImage.src =
        current.image || "";

    contentImage.alt =
        current.title ||
        "Question image";

    contentDescription.textContent =
        current.description || "";
}