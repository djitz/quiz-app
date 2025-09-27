// Quiz state
let quizData = [];
let currentQuestion = 0;
let score = 0;
let timer;
let timeLeft;
let selectedOption = null;
let selectedCategories = []; // Changed to array to track multiple selections
let randomizeQuestions = true; // Default to randomizing questions
let questionSets = [];

// DOM elements
const categoryScreen = document.getElementById('category-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
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
const randomizeQuestionsCheckbox = document.getElementById('randomize-questions');
const categoriesContainer = document.getElementById('categories-container');
const startQuizBtn = document.getElementById('start-quiz-btn');

// Load question sets configuration
async function loadQuestionSetsConfig() {
    try {
        const response = await fetch('config.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const config = await response.json();
        questionSets = config.questionSets;
        renderCategories();
    } catch (error) {
        console.error('Error loading question sets configuration:', error);
        // Fallback to default question sets if config loading fails
        questionSets = [
            {
                id: "general-knowledge",
                file: "general-knowledge.json",
                name: "General Knowledge",
                description: "Test your basic knowledge on various topics"
            }
        ];
        renderCategories();
    }
}

// Render category checkboxes dynamically
function renderCategories() {
    categoriesContainer.innerHTML = ''; // Clear existing content
    
    questionSets.forEach(set => {
        const item = document.createElement('div');
        item.className = 'category-item';
        item.dataset.category = set.file;
        
        item.innerHTML = `
            <input type="checkbox" class="category-checkbox" id="cat-${set.id}">
            <div class="category-content">
                <h3>${set.name}</h3>
                <p>${set.description}</p>
            </div>
        `;
        
        const checkbox = item.querySelector('.category-checkbox');
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                // Add to selected categories
                if (!selectedCategories.includes(set.file)) {
                    selectedCategories.push(set.file);
                }
                item.classList.add('selected');
            } else {
                // Remove from selected categories
                selectedCategories = selectedCategories.filter(cat => cat !== set.file);
                item.classList.remove('selected');
            }
            // Update start button state based on selections
            startQuizBtn.disabled = selectedCategories.length === 0;
        });
        
        categoriesContainer.appendChild(item);
    });
    
    // Update the randomizeQuestions variable when checkbox changes
    randomizeQuestionsCheckbox.addEventListener('change', () => {
        randomizeQuestions = randomizeQuestionsCheckbox.checked;
    });
    
    // Add event listener to start quiz button
    startQuizBtn.addEventListener('click', startQuiz);
}

// Initialize the quiz
async function initQuiz() {
    await loadQuestionSetsConfig();
    nextBtn.addEventListener('click', nextQuestion);
    restartBtn.addEventListener('click', restartQuiz);
}

// Function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray(array) {
    const newArray = [...array]; // Create a copy to avoid mutating the original
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Load quiz data from selected JSON file
async function loadQuizData() {
    try {
        const response = await fetch(currentCategory);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let loadedData = await response.json();
        
        // Randomize question order if the option is selected
        if (randomizeQuestions) {
            quizData = shuffleArray(loadedData);
        } else {
            quizData = loadedData;
        }
        
        totalQuestionsEl.textContent = quizData.length;
    } catch (error) {
        console.error('Error loading quiz data:', error);
        // Fallback to default questions if JSON loading fails
        quizData = [
            {
                question: "Failed to load questions from JSON file",
                options: [
                    {"id": "x1", "text": "Retry"},
                    {"id": "x2", "text": "Reload page"},
                    {"id": "x3", "text": "Check network"},
                    {"id": "x4", "text": "Error occurred"}
                ],
                answer: "x4"
            }
        ];
        totalQuestionsEl.textContent = quizData.length;
    }
}

// Initialize the quiz
async function initQuiz() {
    await loadQuestionSetsConfig();
    nextBtn.addEventListener('click', nextQuestion);
    restartBtn.addEventListener('click', restartQuiz);
}

// Start the quiz
async function startQuiz() {
    // Combine questions from all selected categories
    await loadCombinedQuizData();
    
    categoryScreen.classList.remove('active');
    quizScreen.classList.add('active');
    currentQuestion = 0;
    score = 0;
    showQuestion();
    startTimer();
}

// Load combined quiz data from multiple selected categories
async function loadCombinedQuizData() {
    quizData = [];
    
    // Load questions from each selected category
    for (const category of selectedCategories) {
        try {
            const response = await fetch(category);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const categoryData = await response.json();
            quizData = quizData.concat(categoryData); // Combine all questions
        } catch (error) {
            console.error(`Error loading questions from ${category}:`, error);
        }
    }
    
    // Randomize question order if the option is selected
    if (randomizeQuestions && quizData.length > 0) {
        quizData = shuffleArray(quizData);
    }
    
    totalQuestionsEl.textContent = quizData.length;
    
    // If no questions were loaded successfully
    if (quizData.length === 0) {
        // Fallback to default questions if no categories loaded
        quizData = [
            {
                question: "No questions loaded. Please select valid categories.",
                options: [
                    {"id": "x1", "text": "Retry"},
                    {"id": "x2", "text": "Reload page"},
                    {"id": "x3", "text": "Check selections"},
                    {"id": "x4", "text": "Go back"}
                ],
                answer: "x4"
            }
        ];
        totalQuestionsEl.textContent = quizData.length;
    }
}

// Function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray(array) {
    const newArray = [...array]; // Create a copy to avoid mutating the original
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Show current question
function showQuestion() {
    resetState();
    const question = quizData[currentQuestion];
    questionText.textContent = question.question;
    currentQuestionEl.textContent = currentQuestion + 1;
    
    // Shuffle the options to randomize their order
    const shuffledOptions = shuffleArray(question.options);
    
    shuffledOptions.forEach(option => {
        const button = document.createElement('button');
        button.classList.add('option');
        button.textContent = option.text;
        button.dataset.optionId = option.id; // Store the option ID in data attribute
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
    selectedOption = e.target.dataset.optionId; // Use the option ID instead of text
    nextBtn.disabled = false;
}

// Move to next question
function nextQuestion() {
    const question = quizData[currentQuestion];
    
    // Check if answer is correct by comparing option IDs
    if (selectedOption === question.answer) {
        score++;
        // Highlight correct answer by finding the option button with matching ID
        document.querySelectorAll('.option').forEach(option => {
            if (option.dataset.optionId === question.answer) {
                option.classList.add('correct');
            }
        });
    } else {
        // Highlight correct answer and mark selected as incorrect
        document.querySelectorAll('.option').forEach(option => {
            if (option.dataset.optionId === question.answer) {
                option.classList.add('correct');
            }
            if (option.dataset.optionId === selectedOption) {
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
    categoryScreen.classList.add('active');
    clearInterval(timer);
    selectedCategories = []; // Clear selected categories
    // Re-render categories to reset selection state
    renderCategories();
}

// Initialize the app when page loads
window.onload = initQuiz;