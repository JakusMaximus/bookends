// 1. THE DICTIONARY (Small list for testing - you can add more later)
const dictionary = [
    "ACE", "ACES", "FACES", "FACETS", "ACT", "ACTS", "FACTS", 
    "CAT", "CATS", "SCATS", "SCATHE", "SCATHED",
    "ART", "PART", "PARTS", "PARTY", "PARTING", "STARTING",
    "ICE", "RICE", "PRICE", "PRICES", "PRICED",
    "EAR", "EARN", "EARNS", "LEARN", "LEARNS", "LEARNED",
    "TEN", "TENT", "TENTS", "STENTS",
    "AND", "BAND", "BANDS", "ABANDON", "ABANDONS"
];

// 2. DEFINE ELEMENTS
const input = document.getElementById('word-input');
const stack = document.getElementById('word-stack');
const message = document.getElementById('message');

// 3. THE "DAILY PICKER" FUNCTION
function getDailyWord() {
    let wordList = ["CAT"]; // Absolute emergency backup

    // Check if the starters.js file loaded correctly
    if (typeof DAILY_STARTERS !== 'undefined' && DAILY_STARTERS.length > 0) {
        wordList = DAILY_STARTERS;
    }

    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    const wordIndex = dayOfYear % wordList.length;
    return wordList[wordIndex].toUpperCase();
}

// 4. START THE GAME
let history = [getDailyWord()];

function renderStack() {
    if (!stack) return;
    // Show words in reverse order so the newest is at the top
    stack.innerHTML = history.slice().reverse().map((w, index) => {
        return `<div class="word-card">${w}</div>`;
    }).join('');
}

// Run render immediately when the script loads
renderStack();

// 5. INPUT LOGIC
input.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        const newWord = input.value.toUpperCase().trim();
        handleMove(newWord);
        input.value = '';
    }
});

function handleMove(newWord) {
    const lastWord = history[history.length - 1];

    if (newWord.length !== lastWord.length + 1) {
        return showError("Add exactly 1 letter!");
    }

    const growsFromStart = newWord.endsWith(lastWord);
    const growsFromEnd = newWord.startsWith(lastWord);

    if (!growsFromStart && !growsFromEnd) {
        return showError(`Must include "${lastWord}"`);
    }

    if (!dictionary.includes(newWord)) {
        return showError("Not in word list");
    }

    history.push(newWord);
    renderStack();
    message.innerText = "Accepted!";
    message.style.color = "#55ff55";
}

function showError(txt) {
    message.innerText = txt;
    message.style.color = "#ff5555";
}
