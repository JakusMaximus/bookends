// game.js
const starterWord = "CAT";
const dictionary = ["CAT", "CATS", "SCATS", "SCATHE", "SCATHED"]; // Add thousands more!
let history = [starterWord];

const input = document.getElementById('word-input');
const stack = document.getElementById('word-stack');
const message = document.getElementById('message');

// Initialize the game
renderStack();

input.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        const newWord = input.value.toUpperCase().trim();
        handleMove(newWord);
        input.value = '';
    }
});

function handleMove(newWord) {
    const lastWord = history[history.length - 1];

    // 1. Check length
    if (newWord.length !== lastWord.length + 1) {
        return showError("Must be 1 letter longer!");
    }

    // 2. Check if it grows from start or end
    const growsFromStart = newWord.endsWith(lastWord);
    const growsFromEnd = newWord.startsWith(lastWord);

    if (!growsFromStart && !growsFromEnd) {
        return showError(`Must contain "${lastWord}"`);
    }

    // 3. Check Dictionary
    if (!dictionary.includes(newWord)) {
        return showError("Not a valid word!");
    }

    // Success!
    history.push(newWord);
    renderStack();
    message.innerText = "Nice move!";
    message.style.color = "green";
}

function renderStack() {
    stack.innerHTML = history.map(w => `<div class="word-card">${w}</div>`).join('');
}

function showError(txt) {
    message.innerText = txt;
    message.style.color = "red";
}