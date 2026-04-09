(function() {
    // 1. STATE & DICTIONARY
    let dictionary = [];
    let history = [];

    const input = document.getElementById('word-input');
    const stack = document.getElementById('word-stack');
    const message = document.getElementById('message');
    const shareBtn = document.getElementById('share-btn');

    // 2. FETCH THE DICTIONARY (Automatically loads ~370k words)
    fetch('https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt')
        .then(response => response.text())
        .then(text => {
            // Clean up the text file into an array of uppercase words
            dictionary = text.toUpperCase().split('\n').map(w => w.trim());
            console.log("Dictionary Loaded: " + dictionary.length + " words.");
            
            // Start the game ONLY after dictionary is ready
            initGame();
        })
        .catch(err => {
            console.error("Failed to load dictionary", err);
            showError("Check internet connection.");
        });

    // 3. DAILY WORD LOGIC
    function getDailyWord() {
        let wordList = ["CAT"]; // Fallback if starters.js is missing
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

    // 4. INITIALIZE
    function initGame() {
        history = [getDailyWord()];
        renderStack();
        if (input) input.disabled = false;
    }

    function renderStack() {
        if (!stack) return;
        stack.innerHTML = history.slice().reverse().map((w) => {
            return `<div class="word-card">${w}</div>`;
        }).join('');
    }

    // 5. INPUT HANDLING
    if (input) {
        // Start disabled until dictionary loads
        input.disabled = true; 
        
        input.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                const newWord = input.value.toUpperCase().trim();
                handleMove(newWord);
                input.value = '';
            }
        });
    }

    function handleMove(newWord) {
        const lastWord = history[history.length - 1];

        // Validation: 1 letter longer
        if (newWord.length !== lastWord.length + 1) {
            return showError("Add exactly 1 letter!");
        }

        // Validation: Start or End anchor
        const growsFromStart = newWord.endsWith(lastWord);
        const growsFromEnd = newWord.startsWith(lastWord);

        if (!growsFromStart && !growsFromEnd) {
            return showError(`Must include "${lastWord}"`);
        }

        // Validation: In dictionary
        if (!dictionary.includes(newWord)) {
            return showError("Not a valid word!");
        }

        // SUCCESS
        history.push(newWord);
        renderStack();
        message.innerText = "Accepted!";
        message.style.color = "#55ff55";

        // Show share button if they reach 5 words
        if (history.length >= 5 && shareBtn) {
            shareBtn.style.display = 'block';
            setupShare();
        }
    }

    // 6. SHARE LOGIC
    function setupShare() {
        shareBtn.onclick = () => {
            const chart = history.map(w => "🟩").join("");
            const text = `Bookends Daily Challenge 📈\nI reached ${history.length} letters!\n${chart}\nPlay here: ${window.location.href}`;
            
            if (navigator.share) {
                navigator.share({ title: 'Bookends', text: text });
            } else {
                navigator.clipboard.writeText(text);
                alert("Score copied to clipboard!");
            }
        };
    }

    function showError(txt) {
        message.innerText = txt;
        message.style.color = "#ff5555";
    }
})();
