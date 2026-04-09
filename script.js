(function() {
    // 1. STATE & ELEMENTS
    let dictionary = [];
    let history = [];

    const input = document.getElementById('word-input');
    const stack = document.getElementById('word-stack');
    const message = document.getElementById('message');
    const shareBtn = document.getElementById('share-btn');

    // 2. START THE GAME IMMEDIATELY
    function initGame() {
        // Pick the word first so the user sees something right away
        const dailyWord = getDailyWord();
        history = [dailyWord];
        renderStack();
        
        // Load the dictionary in the background
        loadDictionary();
    }

    // 3. DAILY WORD LOGIC
    function getDailyWord() {
        let wordList = ["CAT"]; 
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

    // 4. DICTIONARY LOAD (Background)
    function loadDictionary() {
        fetch('https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt')
            .then(response => response.text())
            .then(text => {
                dictionary = text.toUpperCase().split('\n').map(w => w.trim());
                console.log("Dictionary Ready");
                if (input) input.placeholder = "Add a letter...";
            })
            .catch(err => {
                console.error("Dictionary failed", err);
                showError("Dictionary error. Refresh page.");
            });
    }

    function renderStack() {
        if (!stack) return;
        stack.innerHTML = history.slice().reverse().map((w) => {
            return `<div class="word-card">${w}</div>`;
        }).join('');
    }

    // 5. INPUT HANDLING
    if (input) {
        input.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                // If dictionary hasn't loaded yet, wait
                if (dictionary.length === 0) {
                    showError("Still loading word list... wait a sec.");
                    return;
                }
                const newWord = input.value.toUpperCase().trim();
                handleMove(newWord);
                input.value = '';
            }
        });
    }

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
            return showError("Not a valid word!");
        }

        history.push(newWord);
        renderStack();
        message.innerText = "Accepted!";
        message.style.color = "#55ff55";

        if (history.length >= 5 && shareBtn) {
            shareBtn.style.display = 'block';
            setupShare();
        }
    }

    function setupShare() {
        shareBtn.onclick = () => {
            const chart = history.map(() => "🟩").join("");
            const text = `Bookends Daily 📈\nI reached ${history.length} letters!\n${chart}\n${window.location.href}`;
            navigator.clipboard.writeText(text);
            alert("Score copied!");
        };
    }

    function showError(txt) {
        message.innerText = txt;
        message.style.color = "#ff5555";
    }

    // ACTIVATE!
    initGame();
})();
