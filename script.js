const PROD_BACKEND_URL = "https://question-tv-backend.onrender.com";

const BASE_URL = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
    ? "http://127.0.0.1:8000"
    : PROD_BACKEND_URL;

const API_URL = `${BASE_URL}/questions`;
const PREVIOUS_MONTH_API_URL = `${BASE_URL}/questions/previous-month`;

let questions = [];
let previousQuestions = [];
let currentIndex = 0;
let previousIndex = 0;
let viewingPreviousMonth = false;
let isAdmin = localStorage.getItem("isAdmin") === "true";
let likeCount = 0;

// DOM ELEMENTS
const questionPillsWrapper = document.getElementById("questionPillsWrapper");
const articleCard = document.getElementById("articleCard");
const contentHeading = document.getElementById("contentHeading");
const contentImage = document.getElementById("contentImage");
const contentDescription = document.getElementById("contentDescription");
const nextButton = document.getElementById("nextButton");
const previousButton = document.getElementById("previousButton");
const previousMonthButton = document.getElementById("previousMonthButton");
const sectionTitle = document.getElementById("sectionTitle");
const sectionSubtext = document.getElementById("sectionSubtext");
const currentDayButton = document.getElementById("currentDayButton");
const currentDayButtonNav = document.getElementById("currentDayButtonNav");
const addQuestionForm = document.getElementById("addQuestionForm");
const deleteQuestionButton = document.getElementById("deleteQuestionButton");
const questionCounter = document.getElementById("questionCounter");
const headerDate = document.getElementById("headerDate");
const bylineDate = document.getElementById("bylineDate");
const metaBadge = document.getElementById("metaBadge");

const qDateInput = document.getElementById("qDate");
const qNumberInput = document.getElementById("qNumber");

// Auth DOM
const adminLoginTrigger = document.getElementById("adminLoginTrigger");
const adminLogoutTrigger = document.getElementById("adminLogoutTrigger");
const loginModal = document.getElementById("loginModal");
const closeModal = document.getElementById("closeModal");
const loginForm = document.getElementById("loginForm");

document.addEventListener("DOMContentLoaded", () => {
    updateHeaderDate();
    applyRolePermissions();
    setupAuthEventListeners();
    setupUserInteractionButtons();
    loadQuestions();
    fetchNextQuestionNumber();
});

function updateHeaderDate() {
    const todayStr = new Date().toISOString().split("T")[0];
    if (headerDate) headerDate.textContent = `DATE: ${todayStr}`;
    if (bylineDate) bylineDate.textContent = `Issue Date: ${todayStr}`;
    if (qDateInput) qDateInput.value = todayStr;
}

function applyRolePermissions() {
    const adminElements = document.querySelectorAll(".admin-only");
    if (isAdmin) {
        adminElements.forEach(el => el.classList.remove("hidden"));
        if (adminLoginTrigger) adminLoginTrigger.classList.add("hidden");
        if (adminLogoutTrigger) adminLogoutTrigger.classList.remove("hidden");
    } else {
        adminElements.forEach(el => el.classList.add("hidden"));
        if (adminLoginTrigger) adminLoginTrigger.classList.remove("hidden");
        if (adminLogoutTrigger) adminLogoutTrigger.classList.add("hidden");
    }
}

function setupAuthEventListeners() {
    if (adminLoginTrigger) {
        adminLoginTrigger.addEventListener("click", () => loginModal.classList.remove("hidden"));
    }
    if (closeModal) {
        closeModal.addEventListener("click", () => loginModal.classList.add("hidden"));
    }
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const password = document.getElementById("adminPassword").value;
            if (password === "admin123") {
                localStorage.setItem("isAdmin", "true");
                isAdmin = true;
                loginModal.classList.add("hidden");
                applyRolePermissions();
            } else {
                alert("Invalid Admin Password!");
            }
        });
    }
    if (adminLogoutTrigger) {
        adminLogoutTrigger.addEventListener("click", () => {
            localStorage.removeItem("isAdmin");
            isAdmin = false;
            applyRolePermissions();
        });
    }
}

function setupUserInteractionButtons() {
    // 1. Like Counter Button
    const likeBtn = document.getElementById("likeBtn");
    const likeCountSpan = document.getElementById("likeCount");
    if (likeBtn && likeCountSpan) {
        likeBtn.addEventListener("click", () => {
            likeCount++;
            likeCountSpan.textContent = likeCount;
        });
    }

    // 2. Speech Synthesis (Listen to Story)
    const listenBtn = document.getElementById("listenBtn");
    if (listenBtn) {
        listenBtn.addEventListener("click", () => {
            const text = contentDescription ? contentDescription.textContent : "";
            if (text) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                window.speechSynthesis.speak(utterance);
            }
        });
    }

    // 3. Save / Bookmark Story
    const bookmarkBtn = document.getElementById("bookmarkBtn");
    if (bookmarkBtn) {
        bookmarkBtn.addEventListener("click", () => {
            alert("Story saved to your reading list!");
        });
    }

    // 4. Share Link Button
    const shareBtn = document.getElementById("shareBtn");
    if (shareBtn) {
        shareBtn.addEventListener("click", () => {
            navigator.clipboard.writeText(window.location.href);
            alert("Story link copied to clipboard!");
        });
    }
}

async function fetchNextQuestionNumber() {
    if (!qDateInput || !qNumberInput) return;
    const selectedDate = qDateInput.value;
    if (!selectedDate) return;

    try {
        const response = await fetch(`${API_URL}/next-number?selected_date=${selectedDate}`);
        if (!response.ok) throw new Error("Failed to fetch next segment number");

        const data = await response.json();
        if (data.next_question_number !== undefined) {
            qNumberInput.value = data.next_question_number;
        }
    } catch (error) {
        console.error("Error fetching next segment number:", error);
    }
}

if (qDateInput) {
    qDateInput.addEventListener("change", fetchNextQuestionNumber);
}

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

function deduplicateQuestions(list) {
    if (!Array.isArray(list)) return [];
    const seenKeys = new Set();
    const uniqueList = [];

    for (const item of list) {
        const key = item.id ? `id-${item.id}` : `${item.date}-${item.question_number}`;
        if (!seenKeys.has(key)) {
            seenKeys.add(key);
            uniqueList.push(item);
        }
    }
    return uniqueList;
}

// RENDER "Segment X" PILL BADGES
function renderQuestionPills(list, activeIdx) {
    if (!questionPillsWrapper) return;
    questionPillsWrapper.innerHTML = "";

    list.forEach((item, index) => {
        const qNum = item.question_number || (index + 1);
        const pill = document.createElement("button");
        pill.className = `q-pill ${index === activeIdx ? "active" : ""}`;
        pill.textContent = `Segment ${qNum}`;
        pill.addEventListener("click", () => {
            if (viewingPreviousMonth) {
                previousIndex = index;
                displayPreviousMonthQuestion();
            } else {
                currentIndex = index;
                displayCurrentQuestion();
            }
        });
        questionPillsWrapper.appendChild(pill);
    });
}

function animateArticleUpdate() {
    if (!articleCard) return;
    articleCard.classList.add("fade-out");
    setTimeout(() => {
        articleCard.classList.remove("fade-out");
    }, 150);
}

async function loadQuestions() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Failed to fetch current segments");

        const data = await response.json();
        questions = deduplicateQuestions(data);

        if (questions.length > 0) {
            currentIndex = 0;
            displayCurrentQuestion();
        } else if (contentHeading && contentDescription) {
            contentHeading.textContent = "No news segments found";
            contentDescription.textContent = "No news stories have been published for today's edition yet.";
            if (contentImage) contentImage.src = "";
            if (questionCounter) questionCounter.textContent = "";
            if (questionPillsWrapper) questionPillsWrapper.innerHTML = "";
        }
    } catch (error) {
        console.error("Error loading current news segments:", error);
        if (contentHeading && contentDescription) {
            contentHeading.textContent = "Unable to load news edition";
            contentDescription.textContent = "Please verify connection to FastAPI backend.";
        }
    }
}

function displayCurrentQuestion() {
    if (questions.length === 0) return;

    animateArticleUpdate();
    const current = questions[currentIndex];
    const num = current.question_number || (currentIndex + 1);

    if (contentHeading) contentHeading.textContent = current.title || `Segment ${num}`;
    if (contentImage) {
        contentImage.src = current.image || "";
        contentImage.alt = current.title || "News segment image";
    }
    if (contentDescription) contentDescription.textContent = current.description || "";

    if (bylineDate) {
        bylineDate.textContent = `Issue Date: ${current.date || new Date().toISOString().split("T")[0]}`;
    }

    if (questionCounter) {
        questionCounter.textContent = `Segment ${currentIndex + 1} of ${questions.length}`;
    }

    if (metaBadge) metaBadge.textContent = `LIVE BROADCAST • SEGMENT ${num}`;
    renderQuestionPills(questions, currentIndex);
}

function displayPreviousMonthQuestion() {
    if (previousQuestions.length === 0) return;

    animateArticleUpdate();
    const current = previousQuestions[previousIndex];
    const num = current.question_number || (previousIndex + 1);

    if (contentHeading) contentHeading.textContent = current.title || `Segment ${num}`;
    if (contentImage) {
        contentImage.src = current.image || "";
        contentImage.alt = current.title || "News segment image";
    }
    if (contentDescription) contentDescription.textContent = current.description || "";

    if (bylineDate) {
        bylineDate.textContent = `Issue Date: ${current.date || "Archive"}`;
    }

    if (questionCounter) {
        questionCounter.textContent = `Segment ${previousIndex + 1} of ${previousQuestions.length}`;
    }

    if (metaBadge) metaBadge.textContent = `ARCHIVE EDITION • SEGMENT ${num}`;
    renderQuestionPills(previousQuestions, previousIndex);
}

// NAVIGATION HANDLERS
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

// ARCHIVE VIA TOP NAVIGATION
if (previousMonthButton) {
    previousMonthButton.addEventListener("click", async function () {
        try {
            const response = await fetch(PREVIOUS_MONTH_API_URL);
            if (!response.ok) throw new Error("Previous month API error");

            const rawData = await response.json();
            previousQuestions = deduplicateQuestions(rawData);

            viewingPreviousMonth = true;
            previousIndex = 0;

            if (currentDayButtonNav) currentDayButtonNav.classList.remove("active");
            if (previousMonthButton) previousMonthButton.classList.add("active");

            const monthName = getPreviousMonthName();
            if (sectionTitle) sectionTitle.textContent = `ARCHIVE EDITION: ${monthName.toUpperCase()}`;
            
            if (sectionSubtext) {
                sectionSubtext.textContent = `Total Archived Segments: ${previousQuestions.length}`;
                sectionSubtext.classList.remove("hidden");
            }

            if (currentDayButton) currentDayButton.classList.remove("hidden");

            if (previousQuestions.length === 0) {
                if (contentHeading) contentHeading.textContent = `No archive news found for ${monthName}`;
                if (contentDescription) contentDescription.textContent = "There are no archived news stories stored for this month.";
                if (contentImage) contentImage.src = "";
                if (questionCounter) questionCounter.textContent = "";
                if (questionPillsWrapper) questionPillsWrapper.innerHTML = "";
                return;
            }

            displayPreviousMonthQuestion();
        } catch (error) {
            console.error("Error loading previous month data:", error);
            if (sectionSubtext) sectionSubtext.textContent = "Unable to fetch archive news data.";
        }
    });
}

function resetToCurrentDay() {
    viewingPreviousMonth = false;
    currentIndex = 0;

    if (currentDayButtonNav) currentDayButtonNav.classList.add("active");
    if (previousMonthButton) previousMonthButton.classList.remove("active");

    if (sectionTitle) sectionTitle.textContent = "TODAY'S EDITION";
    if (sectionSubtext) sectionSubtext.classList.add("hidden");
    if (currentDayButton) currentDayButton.classList.add("hidden");

    displayCurrentQuestion();
}

if (currentDayButton) currentDayButton.addEventListener("click", resetToCurrentDay);
if (currentDayButtonNav) currentDayButtonNav.addEventListener("click", resetToCurrentDay);

// FORM & DELETE ACTIONS
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

            if (!response.ok) throw new Error("Failed to create news segment");

            alert("News segment published successfully!");
            addQuestionForm.reset();

            if (qDateInput) qDateInput.value = new Date().toISOString().split("T")[0];
            await fetchNextQuestionNumber();

            if (!viewingPreviousMonth) {
                await loadQuestions();
            }
        } catch (error) {
            console.error("Error creating news segment:", error);
            alert("Failed to publish news segment.");
        }
    });
}

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

            if (!response.ok) throw new Error("Failed to delete segment");

            alert("Segment removed successfully!");

            if (viewingPreviousMonth) {
                const prevResponse = await fetch(PREVIOUS_MONTH_API_URL);
                const rawPrevData = await prevResponse.json();
                previousQuestions = deduplicateQuestions(rawPrevData);
                previousIndex = 0;
                
                if (sectionSubtext) {
                    sectionSubtext.textContent = `Total Archived Segments: ${previousQuestions.length}`;
                }

                if (previousQuestions.length > 0) {
                    displayPreviousMonthQuestion();
                } else {
                    if (contentHeading) contentHeading.textContent = "No archived news segments remaining.";
                    if (questionCounter) questionCounter.textContent = "";
                    if (questionPillsWrapper) questionPillsWrapper.innerHTML = "";
                }
            } else {
                await loadQuestions();
            }

            await fetchNextQuestionNumber();
        } catch (error) {
            console.error("Error deleting segment:", error);
            alert("Failed to remove news segment.");
        }
    });
}