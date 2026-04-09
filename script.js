let dictionary = [];
let history = ["CAT"]; // We will make this daily later!

// 1. Fetch the big Scrabble dictionary
fetch('dictionary.json')
  .then(response => response.json())
  .then(data => {
      // Scrabble JSONs usually look like { "WORD": "definition" }
      // We just need the words (the "keys")
      dictionary = Object.keys(data); 
      console.log("Dictionary Loaded!");
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
