// 1. Internal Dictionary (Add more words here to make the game harder!)
const dictionary = [
    "ACE", "ACES", "FACES", "FACETS", "ACT", "ACTS", "FACTS", 
    "CAT", "CATS", "SCATS", "SCATHE", "SCATHED",
    "ART", "PART", "PARTS", "PARTY", "PARTING", "STARTING",
    "ICE", "RICE", "PRICE", "PRICES", "PRICED",
    "EAR", "EARN", "EARNS", "LEARN", "LEARNS", "LEARNED",
    "TEN", "TENT", "TENTS", "STENTS",
    "AND", "BAND", "BANDS", "ABANDON", "ABANDONS"
];

// 2. The Daily Picker Logic
function getDailyWord() {
    // If starters.js hasn't loaded for some reason, provide a fallback
    if (typeof DAILY_STARTERS === 'undefined') {
        return "CAT"; 
    }
    
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    const wordIndex = dayOfYear % DAILY_STARTERS.length;
    return DAILY_STARTERS[wordIndex];
}

// 3. Initialize Game State
let history = [getDailyWord()];

// 4. Setup HTML Elements
const input = document.getElementById('word-input');
const stack = document.getElementById('word-stack');
const message = document.getElementById('message');
const dateDisplay = document.getElementById('date-display');

// Display today's date
if (dateDisplay) {
    dateDisplay.innerText = new Date().toLocaleDateString(undefined, { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
}

// Start the game display
renderStack();

// 5. Input Listener
input.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        const newWord = input.value.toUpperCase().trim();
        handleMove(newWord);
        input.value = '';
    }
});

// 6.
