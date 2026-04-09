let dictionary = [];
let history = ["CAT"]; // We will make this daily later!

let dictionary = [];
let history = []; 

// 1. The "Daily Picker" Logic
function getDailyWord() {
    const now = new Date();
    // This creates a unique number for every day of the year
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    // Pick a word from the DAILY_STARTERS list using the day number
    // The % makes sure that if you have 365 words, it loops back to the start next year
    const wordIndex = dayOfYear % DAILY_STARTERS.length;
    return DAILY_STARTERS[wordIndex];
}

// 2. Fetch dictionary and Start Game
fetch('dictionary.json')
  .then(response => response.json())
  .then(data => {
      dictionary = Object.keys(data); 
      
      // Initialize the game with today's word
      const todaysWord = getDailyWord();
      history = [todaysWord];
      
      console.log("Game Ready!");
      renderStack();
  });

const input = document.getElementById('word-input');
const stack = document.getElementById('word-stack');
const message = document.getElementById('message');

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
        return showError("Must be 1 letter longer!");
    }

    if (!newWord.endsWith(lastWord) && !newWord.startsWith(lastWord)) {
        return showError(`Must add to the start or end of ${lastWord}`);
    }

    // This checks if the word exists in the Scrabble list
    if (!dictionary.includes(newWord)) {
        return showError("Not a valid Scrabble word!");
    }

    history.push(newWord);
    renderStack();
    message.innerText = "Accepted!";
    message.style.color = "#538d4e"; // Wordle green
}

function renderStack() {
    stack.innerHTML = history.map(w => `<div class="word-card">${w}</div>`).reverse().join('');
}

function showError(txt) {
    message.innerText = txt;
    message.style.color = "#d7dadc";
}
