// Quiz state
let quizData = [];
let currentQuestion = 0;
let score = 0;
let timer;
let timeLeft;
let selectedOption = null;

// DOM elements
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const startBtn = document.getElementById('start-btn');
const nextBtn = document.getElementById('next-btn');
const restartBtn = document.getElementById('restart-btn');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const currentQuestionEl = document.getElementById('current-question');
const totalQuestionsEl = document.getElementById('total-questions');
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');
const totalEl = document.getElementById('total');
const percentageEl = document.getElementById('percentage');

// Load quiz data from JSON file
async function loadQuizData() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        quizData = await response.json();
        totalQuestionsEl.textContent = quizData.length;
    } catch (error) {
        console.error('Error loading quiz data:', error);
        // Fallback to default questions if JSON loading fails
        quizData = [
            {
                question: "Failed to load questions from JSON file",
                options: ["Retry", "Reload page", "Check network", "Error occurred"],
                answer: "Error occurred"
            }
        ];
        totalQuestionsEl.textContent = quizData.length;
    }
}

// Initialize the quiz
async function initQuiz() {
    await loadQuizData();
    startBtn.addEventListener('click', startQuiz);
    nextBtn.addEventListener('click', nextQuestion);
    restartBtn.addEventListener('click', restartQuiz);
}

// Start the quiz
function startQuiz() {
    startScreen.classList.remove('active');
    quizScreen.classList.add('active');
    currentQuestion = 0;
    score = 0;
    showQuestion();
    startTimer();
}

// Show current question
function showQuestion() {
    resetState();
    const question = quizData[currentQuestion];
    questionText.textContent = question.question;
    currentQuestionEl.textContent = currentQuestion + 1;
    
    question.options.forEach(option => {
        const button = document.createElement('button');
        button.classList.add('option');
        button.textContent = option;
        button.addEventListener('click', selectOption);
        optionsContainer.appendChild(button);
    });
    
    nextBtn.disabled = true;
    selectedOption = null;
}

// Reset options container
function resetState() {
    while (optionsContainer.firstChild) {
        optionsContainer.removeChild(optionsContainer.firstChild);
    }
}

// Select an option
function selectOption(e) {
    // Remove selected class from all options
    document.querySelectorAll('.option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Add selected class to clicked option
    e.target.classList.add('selected');
    selectedOption = e.target.textContent;
    nextBtn.disabled = false;
}

// Move to next question
function nextQuestion() {
    // Check if answer is correct
    if (selectedOption === quizData[currentQuestion].answer) {
        score++;
        // Highlight correct answer
        document.querySelectorAll('.option').forEach(option => {
            if (option.textContent === quizData[currentQuestion].answer) {
                option.classList.add('correct');
            }
        });
    } else {
        // Highlight correct answer and mark selected as incorrect
        document.querySelectorAll('.option').forEach(option => {
            if (option.textContent === quizData[currentQuestion].answer) {
                option.classList.add('correct');
            }
            if (option.textContent === selectedOption) {
                option.classList.add('incorrect');
            }
        });
    }
    
    // Disable all options after answer
    document.querySelectorAll('.option').forEach(option => {
        option.disabled = true;
    });
    
    nextBtn.disabled = false;
    
    currentQuestion++;
    
    if (currentQuestion < quizData.length) {
        setTimeout(() => {
            showQuestion();
            startTimer();
        }, 1500); // Wait 1.5 seconds before showing next question
    } else {
        setTimeout(() => {
            showResults();
        }, 1500); // Wait 1.5 seconds before showing results
    }
}

// Start the timer for each question
function startTimer() {
    clearInterval(timer);
    timeLeft = 30; // 30 seconds per question
    timerEl.textContent = timeLeft;
    
    timer = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            // Auto move to next question if time runs out
            if (selectedOption === null) {
                // If no option selected, move to next question
                setTimeout(() => {
                    nextQuestion();
                }, 1000);
            }
        }
    }, 1000);
}

// Show results
function showResults() {
    quizScreen.classList.remove('active');
    resultScreen.classList.add('active');
    
    scoreEl.textContent = score;
    totalEl.textContent = quizData.length;
    
    const percentage = Math.round((score / quizData.length) * 100);
    percentageEl.textContent = percentage;
}

// Restart the quiz
function restartQuiz() {
    resultScreen.classList.remove('active');
    startScreen.classList.add('active');
    clearInterval(timer);
}

// Initialize the app when page loads
window.onload = initQuiz;