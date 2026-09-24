// =================================
// QUESTION DATA
// =================================

const questions = [
    {
        title: "What is Artificial Intelligence?",
        image: "https://images.pexels.com/photos/8566467/pexels-photo-8566467.jpeg",
        description:
            "Artificial Intelligence is a field of computer science that focuses on creating systems that can perform tasks that normally require human intelligence."
    },

    {
        title: "What is Machine Learning?",
        image: "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg",
        description:
            "Machine Learning is a part of Artificial Intelligence that allows computers to learn from data and make predictions or decisions."
    },

    {
        title: "What is Cloud Computing?",
        image: "https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg",
        description:
            "Cloud Computing allows users to store data and use computing services through the internet."
    },

    {
        title: "What is Internet of Things?",
        image: "https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg",
        description:
            "The Internet of Things connects physical devices to the internet so that they can collect and exchange data."
    },

    {
        title: "What is Cyber Security?",
        image: "https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg",
        description:
            "Cyber Security is the practice of protecting computers, networks, applications, and data from cyber attacks."
    }
];


// =================================
// GET ELEMENTS
// =================================

const buckets = document.querySelectorAll(".bucket");

const contentHeading =
    document.getElementById("contentHeading");

const contentImage =
    document.getElementById("contentImage");

const contentDescription =
    document.getElementById("contentDescription");

const nextButton =
    document.getElementById("nextButton");

const previousButton =
    document.getElementById("previousButton");


// =================================
// CURRENT QUESTION
// =================================

let currentQuestion = 0;


// =================================
// SHOW QUESTION
// =================================

function showQuestion(index) {

    currentQuestion = index;

    // Remove active from all questions
    buckets.forEach(function(bucket) {
        bucket.classList.remove("active");
    });

    // Make selected question active
    buckets[index].classList.add("active");

    // Change heading
    contentHeading.textContent =
        questions[index].title;

    // Change image
    contentImage.src =
        questions[index].image;

    // Change description
    contentDescription.textContent =
        questions[index].description;
}


// =================================
// NEXT BUTTON
// =================================

nextButton.addEventListener("click", function() {

    if (currentQuestion < questions.length - 1) {

        showQuestion(currentQuestion + 1);

    }

});


// =================================
// PREVIOUS BUTTON
// =================================

previousButton.addEventListener("click", function() {

    if (currentQuestion > 0) {

        showQuestion(currentQuestion - 1);

    }

});