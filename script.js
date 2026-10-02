const PROD_BACKEND_URL = "https://question-tv-backend.onrender.com";

const BASE_URL = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
    ? "http://127.0.0.1:8000"
    : PROD_BACKEND_URL;

const API_URL = `${BASE_URL}/questions`;
const PREVIOUS_MONTH_API_URL = `${BASE_URL}/questions/previous-month`;

let questions = [];
let filteredQuestions = [];
let previousQuestions = [];
let currentIndex = 0;
let previousIndex = 0;
let viewingPreviousMonth = false;
let isAdmin = localStorage.getItem("isAdmin") === "true";
let selectedCategory = "All";
let searchQuery = "";
let articleFontSize = 1.15; // default rem

// REGISTER SERVICE WORKER FOR PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW Registration Failed:', err));
    });
}

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
const bylineCategory = document.getElementById("bylineCategory");
const metaBadge = document.getElementById("metaBadge");
const viewCountBadge = document.getElementById("viewCountBadge");

const qDateInput = document.getElementById("qDate");
const qNumberInput = document.getElementById("qNumber");

// Auth DOM
const adminLoginTrigger = document.getElementById("adminLoginTrigger");
const adminLogoutTrigger = document.getElementById("adminLogoutTrigger");
const loginModal = document.getElementById("loginModal");
const closeModal = document.getElementById("closeModal");
const loginForm = document.getElementById("loginForm");

// Saved Stories Modal DOM
const viewSavedBtn = document.getElementById("viewSavedBtn");
const savedStoriesModal = document.getElementById("savedStoriesModal");
const closeSavedModal = document.getElementById("closeSavedModal");
const savedStoriesList = document.getElementById("savedStoriesList");
const savedCountSpan = document.getElementById("savedCount");

// Interactive Elements DOM
const themeToggleBtn = document.getElementById("themeToggleBtn");
const searchInput = document.getElementById("searchInput");
const categoryPills = document.getElementById("categoryPills");
const commentsList = document.getElementById("commentsList");
const commentForm = document.getElementById("commentForm");
const richEditor = document.getElementById("richEditor");

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    updateHeaderDate();
    applyRolePermissions();
    setupAuthEventListeners();
    setupUserInteractionButtons();
    setupSavedStoriesModal();
    setupTextResizing();
    setupSearchAndCategory();
    setupCommentsSystem();
    setupRichTextEditor();
    setupDraftsSystem();
    setupAudioSpeechControls();
    updateSavedCount();
    loadQuestions();
    fetchNextQuestionNumber();
});

// TOAST NOTIFICATIONS
function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// DARK MODE
function initTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        if (themeToggleBtn) themeToggleBtn.textContent = "☀️ Light Mode";
    } else {
        document.body.classList.remove("dark-mode");
        if (themeToggleBtn) themeToggleBtn.textContent = "🌙 Dark Mode";
    }

    if (themeToggleBtn) {
        // Clone and replace button to clear redundant listeners
        const newBtn = themeToggleBtn.cloneNode(true);
        themeToggleBtn.parentNode.replaceChild(newBtn, themeToggleBtn);
        
        newBtn.addEventListener("click", () => {
            const isDark = document.body.classList.toggle("dark-mode");
            localStorage.setItem("theme", isDark ? "dark" : "light");
            newBtn.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
        });
    }
}

// TEXT RESIZING
function setupTextResizing() {
    const decBtn = document.getElementById("fontSizeDec");
    const resetBtn = document.getElementById("fontSizeReset");
    const incBtn = document.getElementById("fontSizeInc");

    if (decBtn) decBtn.addEventListener("click", () => adjustFontSize(-0.1));
    if (resetBtn) resetBtn.addEventListener("click", () => setFontSize(1.15));
    if (incBtn) incBtn.addEventListener("click", () => adjustFontSize(0.1));
}

function adjustFontSize(delta) {
    articleFontSize = Math.min(Math.max(articleFontSize + delta, 0.85), 1.75);
    setFontSize(articleFontSize);
}

function setFontSize(size) {
    articleFontSize = size;
    if (contentDescription) contentDescription.style.fontSize = `${articleFontSize}rem`;
}

// SEARCH & CATEGORY FILTERING
function setupSearchAndCategory() {
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            applyFilters();
        });
    }

    if (categoryPills) {
        categoryPills.addEventListener("click", (e) => {
            if (e.target.classList.contains("cat-pill")) {
                document.querySelectorAll(".cat-pill").forEach(p => p.classList.remove("active"));
                e.target.classList.add("active");
                selectedCategory = e.target.getAttribute("data-category") || "All";
                applyFilters();
            }
        });
    }
}

function applyFilters() {
    const sourceList = viewingPreviousMonth ? previousQuestions : questions;

    filteredQuestions = sourceList.filter(item => {
        const matchesCategory = selectedCategory === "All" || (item.category || "National").toLowerCase() === selectedCategory.toLowerCase();
        const matchesSearch = !searchQuery || 
            (item.title && item.title.toLowerCase().includes(searchQuery)) ||
            (item.description && item.description.toLowerCase().includes(searchQuery));
        return matchesCategory && matchesSearch;
    });

    if (viewingPreviousMonth) {
        previousIndex = 0;
        if (filteredQuestions.length > 0) displayPreviousMonthQuestion();
        else renderEmptyState("No matching archived stories found.");
    } else {
        currentIndex = 0;
        if (filteredQuestions.length > 0) displayCurrentQuestion();
        else renderEmptyState("No matching stories found for your search/filter.");
    }
}

function renderEmptyState(msg) {
    if (contentHeading) contentHeading.textContent = "No Stories Found";
    if (contentDescription) contentDescription.innerHTML = `<p>${msg}</p>`;
    if (contentImage) contentImage.src = "";
    if (questionCounter) questionCounter.textContent = "";
    if (questionPillsWrapper) questionPillsWrapper.innerHTML = "";
}

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
        adminLoginTrigger.addEventListener("click", () => loginModal && loginModal.classList.remove("hidden"));
    }
    if (closeModal) {
        closeModal.addEventListener("click", () => loginModal && loginModal.classList.add("hidden"));
    }
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const passwordInput = document.getElementById("adminPassword");
            const password = passwordInput ? passwordInput.value : "";
            if (password === "admin123") {
                localStorage.setItem("isAdmin", "true");
                isAdmin = true;
                if (loginModal) loginModal.classList.add("hidden");
                applyRolePermissions();
                showToast("Admin Desk Authenticated!", "success");
            } else {
                showToast("Invalid Admin Password!", "error");
            }
        });
    }
    if (adminLogoutTrigger) {
        adminLogoutTrigger.addEventListener("click", () => {
            localStorage.removeItem("isAdmin");
            isAdmin = false;
            applyRolePermissions();
            showToast("Logged out of Admin Desk", "info");
        });
    }
}

// STORY IDENTIFIER
function getCurrentStoryId() {
    const list = filteredQuestions;
    const idx = viewingPreviousMonth ? previousIndex : currentIndex;
    if (!list || list.length === 0 || !list[idx]) return null;
    const story = list[idx];
    return story.id ? `story_${story.id}` : `story_${story.date}_${story.question_number}`;
}

// VIEWS TRACKER
function incrementAndRenderViews(storyId) {
    if (!storyId) return;
    let views = parseInt(localStorage.getItem(`views_${storyId}`) || "0", 10);
    views++;
    localStorage.setItem(`views_${storyId}`, views);
    if (viewCountBadge) viewCountBadge.textContent = `👁️ ${views} Views`;
}

// SAVED COUNT BADGE
function updateSavedCount() {
    const savedStories = JSON.parse(localStorage.getItem("savedStories") || "[]");
    if (savedCountSpan) savedCountSpan.textContent = savedStories.length;
}

// LIKES & SAVED STATES
function updateButtonStates() {
    const storyId = getCurrentStoryId();
    const likeCountSpan = document.getElementById("likeCount");
    const bookmarkBtn = document.getElementById("bookmarkBtn");

    if (!storyId) return;

    incrementAndRenderViews(storyId);

    const storedLikes = localStorage.getItem(`likes_${storyId}`) || 0;
    if (likeCountSpan) likeCountSpan.textContent = storedLikes;

    const savedStories = JSON.parse(localStorage.getItem("savedStories") || "[]");
    const isSaved = savedStories.some(s => s.id === storyId);

    if (bookmarkBtn) {
        if (isSaved) {
            bookmarkBtn.classList.add("active");
            bookmarkBtn.innerHTML = "🔖 Saved Story";
        } else {
            bookmarkBtn.classList.remove("active");
            bookmarkBtn.innerHTML = "🔖 Save Story";
        }
    }

    renderCommentsForCurrentStory(storyId);
}

function setupUserInteractionButtons() {
    const likeBtn = document.getElementById("likeBtn");
    if (likeBtn) {
        likeBtn.addEventListener("click", () => {
            const storyId = getCurrentStoryId();
            if (!storyId) return;

            let currentLikes = parseInt(localStorage.getItem(`likes_${storyId}`) || "0", 10);
            currentLikes++;
            localStorage.setItem(`likes_${storyId}`, currentLikes);

            const likeCountSpan = document.getElementById("likeCount");
            if (likeCountSpan) likeCountSpan.textContent = currentLikes;
            showToast("Liked this story!", "success");
        });
    }

    const bookmarkBtn = document.getElementById("bookmarkBtn");
    if (bookmarkBtn) {
        bookmarkBtn.addEventListener("click", () => {
            const storyId = getCurrentStoryId();
            if (!storyId) return;

            const list = filteredQuestions;
            const idx = viewingPreviousMonth ? previousIndex : currentIndex;
            const currentStory = list[idx];

            let savedStories = JSON.parse(localStorage.getItem("savedStories") || "[]");
            const existingIndex = savedStories.findIndex(s => s.id === storyId);

            if (existingIndex > -1) {
                savedStories.splice(existingIndex, 1);
                localStorage.setItem("savedStories", JSON.stringify(savedStories));
                showToast("Story removed from saved list", "info");
            } else {
                savedStories.push({
                    id: storyId,
                    title: currentStory.title,
                    date: currentStory.date,
                    image: currentStory.image,
                    description: currentStory.description
                });
                localStorage.setItem("savedStories", JSON.stringify(savedStories));
                showToast("Story saved to reading list!", "success");
            }

            updateButtonStates();
            updateSavedCount();
        });
    }

    const shareBtn = document.getElementById("shareBtn");
    if (shareBtn) {
        shareBtn.addEventListener("click", () => {
            const list = filteredQuestions;
            const idx = viewingPreviousMonth ? previousIndex : currentIndex;
            if (list.length === 0) return;
            
            const currentStory = list[idx];
            const segNum = currentStory.question_number || (idx + 1);

            const baseUrl = window.location.origin + window.location.pathname;
            const shareUrl = `${baseUrl}?segment=${segNum}`;

            navigator.clipboard.writeText(shareUrl).then(() => {
                showToast("Direct segment link copied to clipboard!", "success");
            }).catch(() => {
                prompt("Copy this segment link:", shareUrl);
            });
        });
    }
}

// SPEECH AUDIO CONTROLS
function setupAudioSpeechControls() {
    const playBtn = document.getElementById("playAudioBtn");
    const pauseBtn = document.getElementById("pauseAudioBtn");
    const stopBtn = document.getElementById("stopAudioBtn");
    const speedSelect = document.getElementById("speechSpeed");

    if (playBtn) {
        playBtn.addEventListener("click", () => {
            const text = contentDescription ? contentDescription.innerText : "";
            if (!text) return;

            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
                showToast("Resumed audio playback", "info");
                return;
            }

            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            if (speedSelect) utterance.rate = parseFloat(speedSelect.value);
            window.speechSynthesis.speak(utterance);
            showToast("Playing story audio...", "info");
        });
    }

    if (pauseBtn) {
        pauseBtn.addEventListener("click", () => {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.pause();
                showToast("Audio paused", "info");
            }
        });
    }

    if (stopBtn) {
        stopBtn.addEventListener("click", () => {
            window.speechSynthesis.cancel();
            showToast("Audio stopped", "info");
        });
    }
}

// COMMENTS SYSTEM
function setupCommentsSystem() {
    if (commentForm) {
        commentForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const storyId = getCurrentStoryId();
            if (!storyId) return;

            const authorInput = document.getElementById("commentAuthor");
            const textInput = document.getElementById("commentText");

            const author = authorInput ? authorInput.value.trim() : "";
            const text = textInput ? textInput.value.trim() : "";

            if (!author || !text) return;

            const commentsKey = `comments_${storyId}`;
            const comments = JSON.parse(localStorage.getItem(commentsKey) || "[]");

            comments.push({
                author,
                text,
                date: new Date().toLocaleString()
            });

            localStorage.setItem(commentsKey, JSON.stringify(comments));
            if (textInput) textInput.value = "";
            renderCommentsForCurrentStory(storyId);
            showToast("Comment posted!", "success");
        });
    }
}

function renderCommentsForCurrentStory(storyId) {
    if (!commentsList) return;
    commentsList.innerHTML = "";

    const commentsKey = `comments_${storyId}`;
    const comments = JSON.parse(localStorage.getItem(commentsKey) || "[]");

    if (comments.length === 0) {
        commentsList.innerHTML = "<p class='no-comments'>No comments yet. Be the first to start the discussion!</p>";
        return;
    }

    comments.forEach(c => {
        const item = document.createElement("div");
        item.className = "comment-item";
        item.innerHTML = `
            <div class="comment-header">
                <strong>${c.author}</strong>
                <small>${c.date}</small>
            </div>
            <p class="comment-body">${c.text}</p>
        `;
        commentsList.appendChild(item);
    });
}

// SAVED STORIES MODAL
function setupSavedStoriesModal() {
    if (viewSavedBtn) {
        viewSavedBtn.addEventListener("click", () => {
            renderSavedStoriesModal();
            if (savedStoriesModal) savedStoriesModal.classList.remove("hidden");
        });
    }

    if (closeSavedModal) {
        closeSavedModal.addEventListener("click", () => {
            if (savedStoriesModal) savedStoriesModal.classList.add("hidden");
        });
    }
}

function renderSavedStoriesModal() {
    const savedStories = JSON.parse(localStorage.getItem("savedStories") || "[]");
    updateSavedCount();

    if (!savedStoriesList) return;
    savedStoriesList.innerHTML = "";

    if (savedStories.length === 0) {
        savedStoriesList.innerHTML = "<p style='color: #666; font-style: italic; text-align: center;'>No saved stories yet.</p>";
        return;
    }

    savedStories.forEach((story) => {
        const item = document.createElement("div");
        item.className = "saved-story-card";
        item.innerHTML = `
            <div class="saved-story-info">
                <h4>${story.title || "Untitled Story"}</h4>
                <small>Date: ${story.date || "N/A"}</small>
            </div>
            <div class="saved-story-actions">
                <button class="btn btn-sm btn-primary read-saved-btn">Read</button>
                <button class="btn btn-sm btn-danger remove-saved-btn">Remove</button>
            </div>
        `;

        item.querySelector(".read-saved-btn").addEventListener("click", () => {
            loadSavedStoryIntoView(story);
            if (savedStoriesModal) savedStoriesModal.classList.add("hidden");
        });

        item.querySelector(".remove-saved-btn").addEventListener("click", () => {
            removeSavedStory(story.id);
            renderSavedStoriesModal();
            updateButtonStates();
        });

        savedStoriesList.appendChild(item);
    });
}

function loadSavedStoryIntoView(story) {
    animateArticleUpdate();

    if (contentHeading) contentHeading.textContent = story.title || "Saved Story";
    if (contentImage) {
        contentImage.src = story.image || "";
        contentImage.alt = story.title || "Saved Story Image";
    }
    if (contentDescription) contentDescription.innerHTML = story.description || "";
    if (bylineDate) bylineDate.textContent = `Saved Issue Date: ${story.date || "N/A"}`;
    if (metaBadge) metaBadge.textContent = "SAVED READING LIST";
    if (questionCounter) questionCounter.textContent = "";

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function removeSavedStory(storyId) {
    let savedStories = JSON.parse(localStorage.getItem("savedStories") || "[]");
    savedStories = savedStories.filter(s => s.id !== storyId);
    localStorage.setItem("savedStories", JSON.stringify(savedStories));
    updateSavedCount();
}

// RICH TEXT EDITOR & DRAFTS
function setupRichTextEditor() {
    const boldBtn = document.getElementById("richBoldBtn");
    const italicBtn = document.getElementById("richItalicBtn");
    const listBtn = document.getElementById("richListBtn");

    if (boldBtn) boldBtn.addEventListener("click", () => document.execCommand("bold"));
    if (italicBtn) italicBtn.addEventListener("click", () => document.execCommand("italic"));
    if (listBtn) listBtn.addEventListener("click", () => document.execCommand("insertUnorderedList"));
}

function setupDraftsSystem() {
    const saveDraftBtn = document.getElementById("saveDraftBtn");
    const loadDraftBtn = document.getElementById("loadDraftBtn");

    if (saveDraftBtn) {
        saveDraftBtn.addEventListener("click", () => {
            const draft = {
                date: document.getElementById("qDate") ? document.getElementById("qDate").value : "",
                number: document.getElementById("qNumber") ? document.getElementById("qNumber").value : "",
                title: document.getElementById("qTitle") ? document.getElementById("qTitle").value : "",
                category: document.getElementById("qCategory") ? document.getElementById("qCategory").value : "",
                image: document.getElementById("qImage") ? document.getElementById("qImage").value : "",
                description: richEditor ? richEditor.innerHTML : ""
            };
            localStorage.setItem("admin_draft", JSON.stringify(draft));
            showToast("Draft saved successfully!", "success");
        });
    }

    if (loadDraftBtn) {
        loadDraftBtn.addEventListener("click", () => {
            const draftRaw = localStorage.getItem("admin_draft");
            if (!draftRaw) {
                showToast("No saved draft found.", "info");
                return;
            }
            const draft = JSON.parse(draftRaw);
            if (document.getElementById("qDate")) document.getElementById("qDate").value = draft.date || "";
            if (document.getElementById("qNumber")) document.getElementById("qNumber").value = draft.number || "";
            if (document.getElementById("qTitle")) document.getElementById("qTitle").value = draft.title || "";
            if (document.getElementById("qCategory")) document.getElementById("qCategory").value = draft.category || "National";
            if (document.getElementById("qImage")) document.getElementById("qImage").value = draft.image || "";
            if (richEditor) richEditor.innerHTML = draft.description || "";
            showToast("Draft loaded into form!", "info");
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
            applyFilters();
        } else {
            renderEmptyState("No news stories published for today's edition yet.");
        }
    } catch (error) {
        console.error("Error loading current news segments:", error);
        renderEmptyState("Unable to load news edition. Verify FastAPI backend.");
    }
}

function displayCurrentQuestion() {
    if (filteredQuestions.length === 0) return;

    animateArticleUpdate();
    const current = filteredQuestions[currentIndex];
    const num = current.question_number || (currentIndex + 1);

    if (contentHeading) contentHeading.textContent = current.title || `Segment ${num}`;
    if (contentImage) {
        contentImage.src = current.image || "";
        contentImage.alt = current.title || "News segment image";
    }
    if (contentDescription) contentDescription.innerHTML = current.description || "";

    if (bylineDate) {
        bylineDate.textContent = `Issue Date: ${current.date || new Date().toISOString().split("T")[0]}`;
    }

    if (bylineCategory) {
        bylineCategory.textContent = `Category: ${current.category || "National"}`;
    }

    if (questionCounter) {
        questionCounter.textContent = `Segment ${currentIndex + 1} of ${filteredQuestions.length}`;
    }

    if (metaBadge) metaBadge.textContent = `LIVE BROADCAST • SEGMENT ${num}`;
    renderQuestionPills(filteredQuestions, currentIndex);
    updateButtonStates();
}

function displayPreviousMonthQuestion() {
    if (filteredQuestions.length === 0) return;

    animateArticleUpdate();
    const current = filteredQuestions[previousIndex];
    const num = current.question_number || (previousIndex + 1);

    if (contentHeading) contentHeading.textContent = current.title || `Segment ${num}`;
    if (contentImage) {
        contentImage.src = current.image || "";
        contentImage.alt = current.title || "News segment image";
    }
    if (contentDescription) contentDescription.innerHTML = current.description || "";

    if (bylineDate) {
        bylineDate.textContent = `Issue Date: ${current.date || "Archive"}`;
    }

    if (bylineCategory) {
        bylineCategory.textContent = `Category: ${current.category || "National"}`;
    }

    if (questionCounter) {
        questionCounter.textContent = `Segment ${previousIndex + 1} of ${filteredQuestions.length}`;
    }

    if (metaBadge) metaBadge.textContent = `ARCHIVE EDITION • SEGMENT ${num}`;
    renderQuestionPills(filteredQuestions, previousIndex);
    updateButtonStates();
}

// NAVIGATION HANDLERS
if (nextButton) {
    nextButton.addEventListener("click", function () {
        if (filteredQuestions.length === 0) return;
        if (viewingPreviousMonth) {
            previousIndex = (previousIndex + 1) % filteredQuestions.length;
            displayPreviousMonthQuestion();
        } else {
            currentIndex = (currentIndex + 1) % filteredQuestions.length;
            displayCurrentQuestion();
        }
    });
}

if (previousButton) {
    previousButton.addEventListener("click", function () {
        if (filteredQuestions.length === 0) return;
        if (viewingPreviousMonth) {
            previousIndex = (previousIndex - 1 + filteredQuestions.length) % filteredQuestions.length;
            displayPreviousMonthQuestion();
        } else {
            currentIndex = (currentIndex - 1 + filteredQuestions.length) % filteredQuestions.length;
            displayCurrentQuestion();
        }
    });
}

// ARCHIVE NAVIGATION
if (previousMonthButton) {
    previousMonthButton.addEventListener("click", async function () {
        try {
            const response = await fetch(PREVIOUS_MONTH_API_URL);
            if (!response.ok) throw new Error("Previous month API error");

            const rawData = await response.json();
            previousQuestions = deduplicateQuestions(rawData);

            viewingPreviousMonth = true;
            if (currentDayButtonNav) currentDayButtonNav.classList.remove("active");
            if (previousMonthButton) previousMonthButton.classList.add("active");

            const monthName = getPreviousMonthName();
            if (sectionTitle) sectionTitle.textContent = `ARCHIVE EDITION: ${monthName.toUpperCase()}`;
            
            if (sectionSubtext) {
                sectionSubtext.textContent = `Total Archived Segments: ${previousQuestions.length}`;
                sectionSubtext.classList.remove("hidden");
            }

            if (currentDayButton) currentDayButton.classList.remove("hidden");
            applyFilters();
        } catch (error) {
            console.error("Error loading previous month data:", error);
            showToast("Unable to fetch archive news data.", "error");
        }
    });
}

function resetToCurrentDay() {
    viewingPreviousMonth = false;
    if (currentDayButtonNav) currentDayButtonNav.classList.add("active");
    if (previousMonthButton) previousMonthButton.classList.remove("active");

    if (sectionTitle) sectionTitle.textContent = "TODAY'S EDITION";
    if (sectionSubtext) sectionSubtext.classList.add("hidden");
    if (currentDayButton) currentDayButton.classList.add("hidden");

    applyFilters();
}

if (currentDayButton) currentDayButton.addEventListener("click", resetToCurrentDay);
if (currentDayButtonNav) currentDayButtonNav.addEventListener("click", resetToCurrentDay);

// FORM ACTIONS
if (addQuestionForm) {
    addQuestionForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const payload = {
            date: document.getElementById("qDate").value,
            question_number: parseInt(document.getElementById("qNumber").value, 10),
            title: document.getElementById("qTitle").value,
            category: document.getElementById("qCategory").value,
            image: document.getElementById("qImage").value,
            description: richEditor ? richEditor.innerHTML : ""
        };

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Failed to create news segment");

            showToast("News segment published successfully!", "success");
            addQuestionForm.reset();
            if (richEditor) richEditor.innerHTML = "";

            if (qDateInput) qDateInput.value = new Date().toISOString().split("T")[0];
            await fetchNextQuestionNumber();

            if (!viewingPreviousMonth) {
                await loadQuestions();
            }
        } catch (error) {
            console.error("Error creating news segment:", error);
            showToast("Failed to publish news segment.", "error");
        }
    });
}

if (deleteQuestionButton) {
    deleteQuestionButton.addEventListener("click", async function () {
        if (filteredQuestions.length === 0) return;

        const targetIndex = viewingPreviousMonth ? previousIndex : currentIndex;
        const currentQuestion = filteredQuestions[targetIndex];
        const confirmDelete = confirm(`Are you sure you want to delete "${currentQuestion.title}"?`);

        if (!confirmDelete) return;

        try {
            const response = await fetch(`${API_URL}/${currentQuestion.id}`, {
                method: "DELETE"
            });

            if (!response.ok) throw new Error("Failed to delete segment");

            showToast("Segment removed successfully!", "success");

            if (viewingPreviousMonth) {
                const prevResponse = await fetch(PREVIOUS_MONTH_API_URL);
                const rawPrevData = await prevResponse.json();
                previousQuestions = deduplicateQuestions(rawPrevData);
                applyFilters();
            } else {
                await loadQuestions();
            }

            await fetchNextQuestionNumber();
        } catch (error) {
            console.error("Error deleting segment:", error);
            showToast("Failed to remove news segment.", "error");
        }
    });
}