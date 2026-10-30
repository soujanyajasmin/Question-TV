const PROD_BACKEND_URL = "https://question-tv-backend.onrender.com";

const BASE_URL = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
    ? "http://127.0.0.1:8000"
    : PROD_BACKEND_URL;

const API_URL = `${BASE_URL}/questions`;
const PREVIOUS_MONTH_API_URL = `${BASE_URL}/questions/previous-month`;

let selectedLanguage = localStorage.getItem("selectedLanguage") || "en"; 
let selectedCategory = localStorage.getItem("selectedCategory") || "All";

let questions = [];
let filteredQuestions = [];
let previousQuestions = [];
let currentIndex = 0;
let viewingPreviousMonth = false;
let currentSelectedDate = new Date().toISOString().split("T")[0];
let isAdmin = localStorage.getItem("isAdmin") === "true";
let searchQuery = "";
let articleFontSize = 1.15;
let statusTimeout;

// DOM ELEMENTS 
const newsGridContainer = document.getElementById("newsGridContainer") || document.getElementById("newsGrid") || document.getElementById("newsContainer") || document.querySelector(".news-grid");
const editionSection = document.getElementById("editionSection");
const pricingSection = document.getElementById("pricingSection");
const contentHeading = document.getElementById("contentHeading");
const contentImage = document.getElementById("contentImage");
const contentDescription = document.getElementById("contentDescription");
const previousMonthButton = document.getElementById("previousMonthButton");
const previousDayButton = document.getElementById("previousDayButton");
const sectionTitle = document.getElementById("sectionTitle");
const currentDayButton = document.getElementById("currentDayButton");
const currentDayButtonNav = document.getElementById("currentDayButtonNav");
const pricingNavBtn = document.getElementById("pricingNavBtn");
const backToNewsBtn = document.getElementById("backToNewsBtn");
const subscribeNowMainBtn = document.getElementById("subscribeNowMainBtn");
const freeTierSelectBtn = document.getElementById("freeTierSelectBtn");

const addQuestionForm = document.getElementById("addQuestionForm");
const deleteQuestionButton = document.getElementById("deleteQuestionButton");
const headerDate = document.getElementById("headerDate");
const bylineDate = document.getElementById("bylineDate");
const bylineAuthor = document.getElementById("bylineAuthor");
const bylineCategory = document.getElementById("bylineCategory");
const metaBadge = document.getElementById("metaBadge");
const viewCountBadge = document.getElementById("viewCountBadge");
const actionStatusMessage = document.getElementById("actionStatusMessage");

const qDateInput = document.getElementById("qDate");
const qNumberInput = document.getElementById("qNumber");
const qTitleInput = document.getElementById("qTitle");
const qAuthorInput = document.getElementById("qAuthor");
const qCategoryInput = document.getElementById("qCategory");
const qLanguageInput = document.getElementById("qLanguage");
const qImageInput = document.getElementById("qImage");
const qLiveVideoInput = document.getElementById("qLiveVideo");

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
const langControls = document.getElementById("langControls");
const recommendedSidebarList = document.getElementById("recommendedSidebarList");

// Initialization execution 
function initApp() {
    initTheme();
    updateHeaderDate();
    applyRolePermissions();
    setupAuthEventListeners();
    setupUserInteractionButtons();
    setupSavedStoriesModal();
    setupTextResizing();
    setupSearchAndCategory();
    setupLanguageSelector();
    setupCommentsSystem();
    setupRichTextEditor();
    setupDraftsSystem();
    setupAudioSpeechControls();
    setupPricingNavigation();
    updateSavedCount();
    syncUIWithSavedPreferences();
    
    loadQuestions(currentSelectedDate);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}

function setupPricingNavigation() {
    if (pricingNavBtn) {
        pricingNavBtn.addEventListener("click", () => {
            if (newsGridContainer && newsGridContainer.parentNode) {
                newsGridContainer.parentNode.style.display = "none";
            }
            if (editionSection) editionSection.classList.add("hidden");
            if (pricingSection) pricingSection.classList.remove("hidden");
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    if (backToNewsBtn) {
        backToNewsBtn.addEventListener("click", resetToMainNewsGrid);
    }

    if (freeTierSelectBtn) {
        freeTierSelectBtn.addEventListener("click", () => {
            localStorage.setItem("isSubscriber", "false");
            showToast("Switched to Free Edition", "info");
            resetToMainNewsGrid();
        });
    }

    if (subscribeNowMainBtn) {
        subscribeNowMainBtn.addEventListener("click", () => {
            localStorage.setItem("isSubscriber", "true");
            showToast("🎉 Success! Your Question TV Premium Subscription is active.", "success");
            resetToMainNewsGrid();
        });
    }
}

function resetToMainNewsGrid() {
    if (pricingSection) pricingSection.classList.add("hidden");
    if (editionSection) editionSection.classList.add("hidden");
    if (newsGridContainer && newsGridContainer.parentNode) {
        newsGridContainer.parentNode.style.display = "block";
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function syncUIWithSavedPreferences() {
    if (langControls) {
        document.querySelectorAll(".lang-btn").forEach(btn => {
            if (btn.getAttribute("data-lang") === selectedLanguage) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });
    }

    if (categoryPills) {
        document.querySelectorAll(".cat-pill").forEach(pill => {
            if (pill.getAttribute("data-category") === selectedCategory) {
                pill.classList.add("active");
            } else {
                pill.classList.remove("active");
            }
        });
    }

    if (qLanguageInput) {
        qLanguageInput.value = selectedLanguage;
    }
}

function setupLanguageSelector() {
    if (!langControls) return;

    langControls.addEventListener("click", (e) => {
        const btn = e.target.closest(".lang-btn");
        if (btn) {
            const lang = btn.getAttribute("data-lang");
            if (lang && lang !== selectedLanguage) {
                selectedLanguage = lang;
                localStorage.setItem("selectedLanguage", lang);
                document.querySelectorAll(".lang-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                
                if (qLanguageInput) {
                    qLanguageInput.value = lang;
                }

                showToast(`Switching language to ${getLanguageName(lang)}...`, "info");
                applyFilters();
                fetchNextQuestionNumber(); 
            }
        }
    });

    if (qLanguageInput) {
        qLanguageInput.addEventListener("change", () => {
            fetchNextQuestionNumber();
        });
    }
}

function getLanguageName(code) {
    if (code === "te") return "Telugu (తెలుగు)";
    if (code === "hi") return "Hindi (हिन्दी)";
    return "English";
}

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

function showActionNotification(message) {
    if (!actionStatusMessage) return;
    actionStatusMessage.textContent = message;
    actionStatusMessage.classList.add("show");

    clearTimeout(statusTimeout);
    statusTimeout = setTimeout(() => {
        actionStatusMessage.classList.remove("show");
    }, 2500);
}

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
        const newBtn = themeToggleBtn.cloneNode(true);
        themeToggleBtn.parentNode.replaceChild(newBtn, themeToggleBtn);
        newBtn.addEventListener("click", () => {
            const isDark = document.body.classList.toggle("dark-mode");
            localStorage.setItem("theme", isDark ? "dark" : "light");
            newBtn.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
        });
    }
}

function setupTextResizing() {
    const decBtn = document.getElementById("fontSizeDec");
    const resetBtn = document.getElementById("fontSizeReset");
    const incBtn = document.getElementById("fontSizeInc");

    if (decBtn) decBtn.addEventListener("click", () => adjustFontSize(-0.1, decBtn));
    if (resetBtn) resetBtn.addEventListener("click", () => setFontSize(1.15, resetBtn));
    if (incBtn) incBtn.addEventListener("click", () => adjustFontSize(0.1, incBtn));
}

function adjustFontSize(delta, activeBtn) {
    articleFontSize = Math.min(Math.max(articleFontSize + delta, 0.85), 1.75);
    setFontSize(articleFontSize, activeBtn);
}

function setFontSize(size, activeBtn) {
    articleFontSize = size;
    if (contentDescription) contentDescription.style.fontSize = `${articleFontSize}rem`;

    document.querySelectorAll(".resizer-btn-equal").forEach(btn => btn.classList.remove("active"));
    if (activeBtn) activeBtn.classList.add("active");
    else {
        const resetBtn = document.getElementById("fontSizeReset");
        if (resetBtn && size === 1.15) resetBtn.classList.add("active");
    }
}

function setupSearchAndCategory() {
    const clearBtn = document.getElementById("clearSearchBtn");

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            if (clearBtn) {
                if (searchQuery.length > 0) clearBtn.classList.remove("hidden");
                else clearBtn.classList.add("hidden");
            }
            applyFilters();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            if (searchInput) searchInput.value = "";
            searchQuery = "";
            clearBtn.classList.add("hidden");
            applyFilters();
        });
    }

    if (categoryPills) {
        categoryPills.addEventListener("click", (e) => {
            const pill = e.target.closest(".cat-pill");
            if (pill) {
                const targetCat = pill.getAttribute("data-category") || "All";
                selectedCategory = targetCat;
                localStorage.setItem("selectedCategory", targetCat);

                document.querySelectorAll(".cat-pill").forEach(p => {
                    if (p.getAttribute("data-category") === targetCat) {
                        p.classList.add("active");
                    } else {
                        p.classList.remove("active");
                    }
                });

                applyFilters();
            }
        });
    }
}

function applyFilters() {
    let sourceList = viewingPreviousMonth ? previousQuestions : questions;

    if (!sourceList || sourceList.length === 0) {
        sourceList = [];
    }

    let langFiltered = sourceList.filter(item => {
        const itemLang = item.language || "en";
        return itemLang === selectedLanguage;
    });

    let results = [];
    if (searchQuery) {
        results = langFiltered.filter(item => {
            return (item.title && item.title.toLowerCase().includes(searchQuery)) ||
                   (item.description && item.description.toLowerCase().includes(searchQuery)) ||
                   (item.category && item.category.toLowerCase().includes(searchQuery));
        });
    } else if (selectedCategory === "All") {
        results = langFiltered;
    } else {
        results = langFiltered.filter(item => {
            const itemCat = (item.category || "").toLowerCase();
            const selCat = selectedCategory.toLowerCase();
            return itemCat === selCat || itemCat.includes(selCat) || selCat.includes(itemCat);
        });
    }

    filteredQuestions = results;
    const maxLimit = viewingPreviousMonth ? 10 : 9;
    renderNewsGrid(filteredQuestions.slice(0, maxLimit), viewingPreviousMonth);
}

function renderEmptyState(msg) {
    if (newsGridContainer) {
        newsGridContainer.innerHTML = `<p style='grid-column: 1/-1; text-align: center; color: var(--color-text-muted); padding: 40px; font-size: 1.1rem;'>${msg}</p>`;
    }
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

function getCurrentStoryId() {
    const list = filteredQuestions;
    if (!list || list.length === 0 || !list[currentIndex]) return null;
    const story = list[currentIndex];
    return story.id ? `story_${story.id}` : `story_${story.date}_${story.question_number}`;
}

function incrementAndRenderViews(storyId) {
    if (!storyId) return;
    let views = parseInt(localStorage.getItem(`views_${storyId}`) || "0", 10);
    views++;
    localStorage.setItem(`views_${storyId}`, views);
    if (viewCountBadge) viewCountBadge.textContent = `👁️ ${views} Views`;
}

function updateSavedCount() {
    const savedStories = JSON.parse(localStorage.getItem("savedStories") || "[]");
    if (savedCountSpan) savedCountSpan.textContent = savedStories.length;
}

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
            showActionNotification("Story liked!");
        });
    }

    const bookmarkBtn = document.getElementById("bookmarkBtn");
    if (bookmarkBtn) {
        bookmarkBtn.addEventListener("click", () => {
            const storyId = getCurrentStoryId();
            if (!storyId) return;

            const currentStory = filteredQuestions[currentIndex];
            let savedStories = JSON.parse(localStorage.getItem("savedStories") || "[]");
            const existingIndex = savedStories.findIndex(s => s.id === storyId);

            if (existingIndex > -1) {
                savedStories.splice(existingIndex, 1);
                localStorage.setItem("savedStories", JSON.stringify(savedStories));
                showActionNotification("Story removed from saved list");
            } else {
                savedStories.push({
                    id: storyId,
                    title: currentStory.title || "Untitled Story",
                    date: currentStory.date || new Date().toISOString().split("T")[0],
                    image: currentStory.image || "",
                    description: currentStory.description || "",
                    live_video: currentStory.live_video || ""
                });
                localStorage.setItem("savedStories", JSON.stringify(savedStories));
                showActionNotification("The story is saved");
            }

            updateButtonStates();
            updateSavedCount();
        });
    }

    const shareBtn = document.getElementById("shareBtn");
    if (shareBtn) {
        shareBtn.addEventListener("click", () => {
            if (filteredQuestions.length === 0) return;
            const currentStory = filteredQuestions[currentIndex];
            const segNum = currentStory.question_number || (currentIndex + 1);
            const shareUrl = `${window.location.origin + window.location.pathname}?segment=${segNum}`;

            navigator.clipboard.writeText(shareUrl).then(() => {
                showActionNotification("The link is copied");
            }).catch(() => {
                prompt("Copy this segment link:", shareUrl);
            });
        });
    }
}

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
            
            if (selectedLanguage === "te") utterance.lang = "te-IN";
            else if (selectedLanguage === "hi") utterance.lang = "hi-IN";
            else utterance.lang = "en-US";

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

            comments.push({ author, text, date: new Date().toLocaleString() });
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
            let saved = JSON.parse(localStorage.getItem("savedStories") || "[]");
            saved = saved.filter(s => s.id !== story.id);
            localStorage.setItem("savedStories", JSON.stringify(saved));
            renderSavedStoriesModal();
            updateButtonStates();
        });

        savedStoriesList.appendChild(item);
    });
}

function loadSavedStoryIntoView(story) {
    if (editionSection) editionSection.classList.remove("hidden");
    if (contentHeading) contentHeading.textContent = story.title || "Saved Story";
    if (contentImage) {
        contentImage.src = story.image || "";
        contentImage.alt = story.title || "Saved Story Image";
    }
    if (contentDescription) contentDescription.innerHTML = story.description || "";
    if (bylineDate) bylineDate.textContent = `Saved Issue Date: ${story.date || "N/A"}`;
    if (metaBadge) metaBadge.textContent = "SAVED READING LIST";

    window.scrollTo({ top: editionSection.offsetTop - 20, behavior: "smooth" });
}

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
                author: document.getElementById("qAuthor") ? document.getElementById("qAuthor").value : "",
                category: document.getElementById("qCategory") ? document.getElementById("qCategory").value : "National",
                language: document.getElementById("qLanguage") ? document.getElementById("qLanguage").value : "en",
                image: document.getElementById("qImage") ? document.getElementById("qImage").value : "",
                live_video: qLiveVideoInput ? qLiveVideoInput.value : "",
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
            if (document.getElementById("qAuthor")) document.getElementById("qAuthor").value = draft.author || "";
            if (document.getElementById("qCategory")) document.getElementById("qCategory").value = draft.category || "National";
            if (document.getElementById("qLanguage")) document.getElementById("qLanguage").value = draft.language || "en";
            if (document.getElementById("qImage")) document.getElementById("qImage").value = draft.image || "";
            if (qLiveVideoInput) qLiveVideoInput.value = draft.live_video || "";
            if (richEditor) richEditor.innerHTML = draft.description || "";
            showToast("Draft loaded into form!", "info");
        });
    }
}

async function fetchNextQuestionNumber() {
    if (!qNumberInput) return;
    const todayStr = new Date().toISOString().split("T")[0];
    const dateVal = qDateInput ? qDateInput.value : todayStr;
    const langVal = qLanguageInput ? qLanguageInput.value : selectedLanguage;
    
    try {
        const response = await fetch(`${BASE_URL}/questions/next-number?selected_date=${dateVal}&language=${langVal}`);
        if (response.ok) {
            const data = await response.json();
            qNumberInput.value = data.next_question_number || 1;
            return;
        }
    } catch (err) {
        console.warn("Could not fetch next question number from API:", err);
    }
    
    const langCount = questions.filter(q => (q.language || "en") === langVal).length;
    qNumberInput.value = langCount + 1;
}

if (qDateInput) {
    qDateInput.addEventListener("change", fetchNextQuestionNumber);
}
if (qLanguageInput) {
    qLanguageInput.addEventListener("change", fetchNextQuestionNumber);
}

function deduplicateQuestions(list) {
    if (!Array.isArray(list)) return [];
    const seenKeys = new Set();
    const uniqueList = [];
    for (const item of list) {
        const key = item.id ? `id-${item.id}` : `${item.date}-${item.question_number}-${item.language || 'en'}`;
        if (!seenKeys.has(key)) {
            seenKeys.add(key);
            uniqueList.push(item);
        }
    }
    return uniqueList;
}

function renderNewsGrid(list, isArchive = false) {
    if (!newsGridContainer) return;
    newsGridContainer.innerHTML = "";

    if (!list || list.length === 0) {
        renderEmptyState(`No stories found for category "${selectedCategory}" in ${getLanguageName(selectedLanguage)}.`);
        return;
    }

    const maxLimit = isArchive ? 10 : 9;
    const displayList = list.slice(0, maxLimit);

    displayList.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "news-grid-card";
        
        const imgSrc = item.image && item.image.trim() !== "" ? item.image : "";
        const title = item.title || "Untitled News Story";
        const category = item.category || selectedCategory;
        const date = item.date || new Date().toISOString().split("T")[0];
        
        let snippetText = "";
        if (item.description) {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = item.description;
            snippetText = tempDiv.textContent || tempDiv.innerText || "";
        }

        const imgHtml = imgSrc ? `
            <div class="news-grid-img-wrapper" style="background-color: #f0f0f0; min-height: 160px; overflow: hidden;">
                <img src="${imgSrc}" alt="${title}" class="news-grid-img" style="width:100%; height:100%; object-fit:cover;">
            </div>
        ` : "";

        card.innerHTML = `
            ${imgHtml}
            <div class="news-grid-body">
                <div class="news-grid-meta">
                    <span>${category}</span>
                    <span>${date}</span>
                </div>
                <h3 class="news-grid-title">${title}</h3>
                <p class="news-grid-snippet">${snippetText}</p>
            </div>
        `;

        card.addEventListener("click", () => {
            if (pricingSection) pricingSection.classList.add("hidden");
            if (newsGridContainer && newsGridContainer.parentNode) {
                newsGridContainer.parentNode.style.display = "block";
            }
            if (editionSection) editionSection.classList.remove("hidden");
            currentIndex = index;
            displayCurrentQuestion();
            editionSection.scrollIntoView({ behavior: "smooth", block: "start" });

            if (isAdmin) {
                if (qDateInput) qDateInput.value = item.date || new Date().toISOString().split("T")[0];
                if (qNumberInput) qNumberInput.value = item.question_number || (index + 1);
                if (qTitleInput) qTitleInput.value = item.title || "";
                if (qAuthorInput) qAuthorInput.value = item.author || "Question TV News Desk";
                if (qCategoryInput) qCategoryInput.value = item.category || "National";
                if (qLanguageInput) qLanguageInput.value = item.language || selectedLanguage;
                if (qImageInput) qImageInput.value = item.image || "";
                if (qLiveVideoInput) qLiveVideoInput.value = item.live_video || "";
                if (richEditor) richEditor.innerHTML = item.description || "";
            }
        });

        newsGridContainer.appendChild(card);
    });
}

async function loadQuestions(dateStr = "") {
    try {
        const queryParam = dateStr ? `?selected_date=${dateStr}` : "";
        const response = await fetch(`${API_URL}${queryParam}`);
        if (response.ok) {
            const data = await response.json();
            questions = deduplicateQuestions(data);
        }
    } catch (error) {
        console.warn("Backend API unavailable:", error);
        questions = [];
    }

    applyFilters();
    fetchNextQuestionNumber();
}

async function loadRecommendedSidebar(category, currentId) {
    if (!recommendedSidebarList) return;
    try {
        const response = await fetch(`${BASE_URL}/questions/related/${category}?exclude_id=${currentId || 0}&language=${selectedLanguage}`);
        if (!response.ok) throw new Error("Failed to fetch recommendations");
        const related = await response.json();

        if (!related || related.length === 0) {
            recommendedSidebarList.innerHTML = '<p style="font-size: 0.85rem; color: #666;">No related stories available.</p>';
            return;
        }

        recommendedSidebarList.innerHTML = related.map(story => `
            <div class="recommended-item" data-id="${story.id}" style="display: flex; gap: 12px; margin-bottom: 14px; align-items: center; cursor: pointer; padding-bottom: 10px; border-bottom: 1px solid var(--border-color, #eee);">
                ${story.image ? `<img src="${story.image}" alt="Thumbnail" style="width: 80px; height: 55px; object-fit: cover; border-radius: 4px; flex-shrink: 0;">` : ""}
                <div>
                    <span style="font-size: 0.7rem; color: var(--primary-red); font-weight: 700; display: block; margin-bottom: 2px;">${(story.category || "GENERAL").toUpperCase()}</span>
                    <h4 style="font-size: 0.85rem; line-height: 1.25; font-family: var(--font-sans); color: var(--color-text, #111);">${story.title}</h4>
                </div>
            </div>
        `).join("");

        recommendedSidebarList.querySelectorAll(".recommended-item").forEach(item => {
            item.addEventListener("click", () => {
                const sId = parseInt(item.getAttribute("data-id"), 10);
                const foundIndex = filteredQuestions.findIndex(q => q.id === sId);
                if (foundIndex !== -1) {
                    currentIndex = foundIndex;
                    displayCurrentQuestion();
                    window.scrollTo({ top: editionSection.offsetTop - 20, behavior: "smooth" });
                }
            });
        });
    } catch (err) {
        console.warn("Could not load recommendations sidebar:", err);
        recommendedSidebarList.innerHTML = '<p style="font-size: 0.85rem; color: #666;">Unable to load recommendations.</p>';
    }
}

function displayCurrentQuestion() {
    if (filteredQuestions.length === 0) return;

    const current = filteredQuestions[currentIndex];
    const num = current.question_number || (currentIndex + 1);
    const imgSrc = current.image && current.image.trim() !== "" ? current.image : "";
    const liveVideoUrl = current.live_video ? current.live_video.trim() : "";

    if (contentHeading) contentHeading.textContent = current.title || `Segment ${num}`;
    
    const existingVideoContainer = document.getElementById("activeLiveVideoContainer");
    
    if (liveVideoUrl) {
        if (contentImage && contentImage.parentNode) contentImage.parentNode.style.display = "none";
        
        if (!existingVideoContainer) {
            const vidDiv = document.createElement("div");
            vidDiv.id = "activeLiveVideoContainer";
            vidDiv.style.cssText = "position:relative; padding-bottom:56.25%; height:0; margin-bottom:24px; background:#000; border-radius:8px; overflow:hidden;";
            
            if (liveVideoUrl.endsWith(".m3u8")) {
                vidDiv.innerHTML = `<video controls autoplay style="position:absolute;top:0;left:0;width:100%;height:100%;"><source src="${liveVideoUrl}" type="application/x-mpegURL"></video>`;
            } else {
                vidDiv.innerHTML = `<iframe src="${liveVideoUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe>`;
            }
            if (contentImage && contentImage.parentNode && contentImage.parentNode.parentNode) {
                contentImage.parentNode.parentNode.insertBefore(vidDiv, contentImage.parentNode);
            }
        } else {
            existingVideoContainer.style.display = "block";
            const iframe = existingVideoContainer.querySelector("iframe");
            if (iframe) iframe.src = liveVideoUrl;
        }
    } else {
        if (existingVideoContainer) existingVideoContainer.style.display = "none";
        if (contentImage && contentImage.parentNode) {
            contentImage.parentNode.style.display = "block";
            if (imgSrc) {
                contentImage.src = imgSrc;
                contentImage.style.display = "block";
            } else {
                contentImage.style.display = "none";
            }
            contentImage.alt = current.title || "News segment image";
        }
    }

    if (contentDescription) contentDescription.innerHTML = current.description || "";
    if (bylineDate) bylineDate.textContent = `Issue Date: ${current.date || new Date().toISOString().split("T")[0]}`;
    if (bylineAuthor) bylineAuthor.textContent = current.author || "Question TV News Desk";
    if (bylineCategory) bylineCategory.textContent = `Category: ${current.category || selectedCategory}`;
    if (metaBadge) metaBadge.textContent = liveVideoUrl ? "LIVE BROADCAST FEED" : `DAILY EDITION • STORY ${num}`;

    updateButtonStates();
    loadRecommendedSidebar(current.category || "National", current.id || 0);
}

if (previousDayButton) {
    previousDayButton.addEventListener("click", function () {
        viewingPreviousMonth = false;
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        if (currentDayButtonNav) currentDayButtonNav.classList.remove("active");
        if (previousMonthButton) previousMonthButton.classList.remove("active");
        previousDayButton.classList.add("active");

        if (sectionTitle) sectionTitle.textContent = `ARCHIVE EDITION: ${yesterdayStr}`;
        if (currentDayButton) currentDayButton.classList.remove("hidden");

        const headingEl = document.getElementById("highlightsHeading") || document.querySelector(".news-grid-section h2");
        if (headingEl) headingEl.textContent = `📰 YESTERDAY'S EDITION HIGHLIGHTS (${yesterdayStr})`;

        loadQuestions(yesterdayStr);
        showToast(`Loaded edition for ${yesterdayStr}`, "success");
    });
}

if (previousMonthButton) {
    previousMonthButton.addEventListener("click", async function () {
        try {
            const now = new Date();
            let year = now.getFullYear();
            let month = now.getMonth(); 

            month -= 1;
            if (month < 0) {
                month = 11;
                year -= 1;
            }

            const formattedMonth = String(month + 1).padStart(2, '0');
            const prevYearMonth = `${year}-${formattedMonth}`; // Returns "2026-09"

            const response = await fetch(`${PREVIOUS_MONTH_API_URL}?target_month=${prevYearMonth}`);
            if (!response.ok) throw new Error("Previous month API error");

            const rawData = await response.json();
            previousQuestions = deduplicateQuestions(rawData);
            
            viewingPreviousMonth = true;
            selectedCategory = "All"; 
            
            if (categoryPills) {
                document.querySelectorAll(".cat-pill").forEach(p => {
                    if (p.getAttribute("data-category") === "All") {
                        p.classList.add("active");
                    } else {
                        p.classList.remove("active");
                    }
                });
            }

            if (currentDayButtonNav) currentDayButtonNav.classList.remove("active");
            if (previousDayButton) previousDayButton.classList.remove("active");
            previousMonthButton.classList.add("active");

            if (sectionTitle) sectionTitle.textContent = `ARCHIVE EDITION: ${prevYearMonth}`;
            if (currentDayButton) currentDayButton.classList.add("hidden");

            const headingEl = document.getElementById("highlightsHeading") || document.querySelector(".news-grid-section h2");
            if (headingEl) headingEl.textContent = `📰 PREVIOUS MONTH ARCHIVE (${prevYearMonth})`;

            applyFilters();
            showToast(`Loaded archive for ${prevYearMonth}`, "success");
        } catch (error) {
            console.warn("Previous month API unavailable or failed to connect to database.", error);
            showToast("Failed to fetch archive from database.", "error");
            previousQuestions = [];
        }
    });
}

function resetToCurrentDay() {
    viewingPreviousMonth = false;
    if (pricingSection) pricingSection.classList.add("hidden");
    if (newsGridContainer && newsGridContainer.parentNode) {
        newsGridContainer.parentNode.style.display = "block";
    }
    if (currentDayButtonNav) currentDayButtonNav.classList.add("active");
    if (previousDayButton) previousDayButton.classList.remove("active");
    if (previousMonthButton) previousMonthButton.classList.remove("active");
    if (sectionTitle) sectionTitle.textContent = "STORY READER & LIVE BROADCAST";
    if (currentDayButton) currentDayButton.classList.add("hidden");

    const headingEl = document.getElementById("highlightsHeading") || document.querySelector(".news-grid-section h2");
    if (headingEl) headingEl.textContent = "📰 TODAY'S HIGHLIGHTS & STORIES";

    loadQuestions(currentSelectedDate);
}

if (currentDayButton) currentDayButton.addEventListener("click", resetToCurrentDay);
if (currentDayButtonNav) currentDayButtonNav.addEventListener("click", resetToCurrentDay);

if (addQuestionForm) {
    addQuestionForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        
        const payload = {
            date: document.getElementById("qDate").value || new Date().toISOString().split("T")[0],
            question_number: parseInt(document.getElementById("qNumber").value, 10) || 1,
            title: document.getElementById("qTitle").value || "Untitled News",
            author: document.getElementById("qAuthor") ? document.getElementById("qAuthor").value : "Question TV News Desk",
            category: document.getElementById("qCategory").value || "National",
            language: document.getElementById("qLanguage").value || selectedLanguage,
            image: document.getElementById("qImage").value || "",
            live_video: qLiveVideoInput ? qLiveVideoInput.value.trim() : "",
            description: richEditor ? richEditor.innerHTML : ""
        };

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || "Failed to create news segment");
            }

            showToast("News segment published/updated successfully!", "success");
            addQuestionForm.reset();
            if (richEditor) richEditor.innerHTML = "";
            if (qDateInput) qDateInput.value = new Date().toISOString().split("T")[0];
            if (qLanguageInput) qLanguageInput.value = selectedLanguage;
            
            await loadQuestions(currentSelectedDate);
            await fetchNextQuestionNumber();
        } catch (error) {
            console.error("Publishing Error:", error);
            showToast(`Failed to publish: ${error.message}`, "error");
        }
    });
}

if (deleteQuestionButton) {
    deleteQuestionButton.addEventListener("click", async function () {
        if (filteredQuestions.length === 0) return;
        const currentQuestion = filteredQuestions[currentIndex];
        if (!confirm(`Are you sure you want to delete "${currentQuestion.title}"?`)) return;

        try {
            const response = await fetch(`${API_URL}/${currentQuestion.id}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Failed to delete segment");
            showToast("Segment removed successfully!", "success");
            await loadQuestions(currentSelectedDate);
            await fetchNextQuestionNumber();
            if (editionSection) editionSection.classList.add("hidden");
        } catch (error) {
            showToast("Failed to remove news segment.", "error");
        }
    });
}