// API URL
const API_URL = "http://127.0.0.1:8000/questions";

// Get HTML elements
const buckets = document.querySelectorAll(".bucket");

const contentHeading = document.getElementById("contentHeading");
const contentImage = document.getElementById("contentImage");
const contentDescription = document.getElementById("contentDescription");

const nextButton = document.getElementById("nextButton");
const previousButton = document.getElementById("previousButton");

// Store questions
let questions = [];

// Current question
let currentQuestion = 0;


// =====================================
// LOAD QUESTIONS FROM FASTAPI
// =====================================

async function loadQuestions() {

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("API error");
        }

        questions = await response.json();

        console.log("Questions loaded:", questions);

        // Show first question
        showQuestion(0);

    } catch (error) {

        console.error("Error loading questions:", error);

        contentHeading.textContent = "Unable to load questions";

        contentDescription.textContent =
            "Please make sure FastAPI is running.";

    }
}

// =====================================
// SHOW QUESTION
// =====================================

function showQuestion(index) {

    if (questions.length === 0) {
        return;
    }

    if (index < 0 || index >= questions.length) {
        return;
    }

    currentQuestion = index;

    const question = questions[index];

    // Remove active from all buckets
    buckets.forEach(function(bucket) {
        bucket.classList.remove("active");
    });

    // Activate current bucket
    buckets[index].classList.add("active");

    // Change bucket text
    buckets[index].textContent =
        "Question " + question.question_number;

    // Change heading
    contentHeading.textContent =
        question.title;

    // Change image
    contentImage.src =
        question.image;

    // Change description
    contentDescription.textContent =
        question.description;

    console.log("Showing question:", index + 1);
}

// =====================================
// RIGHT ARROW
// =====================================

nextButton.onclick = function() {

    console.log("Right arrow clicked");

    if (currentQuestion < questions.length - 1) {

        currentQuestion++;

        showQuestion(currentQuestion);

    }

};

// =====================================
// LEFT ARROW
// =====================================

previousButton.onclick = function() {

    console.log("Left arrow clicked");

    if (currentQuestion > 0) {

        currentQuestion--;

        showQuestion(currentQuestion);

    }

};

// =====================================
// START
// =====================================

loadQuestions();