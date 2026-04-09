(function() {
    // 1. STATE
    let dictionary = [];
    let history = [];
    let isGameOver = false;

    const input = document.getElementById('word-input');
    const stack = document.getElementById('word-stack');
    const message = document.getElementById('message');
    const shareBtn = document.getElementById('share-btn');
    const keyboard = document.getElementById('keyboard');

    // 2. INITIALIZE
    function init() {
        // Build keyboard first so it's visible immediately
        createKeyboard();
        
        // Setup the starter word
        let wordList = ["CAT"]; 
        if (typeof DAILY_STARTERS !== 'undefined') wordList = DAILY_STARTERS;
        
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const dayOfYear = Math.floor((now - start) / (1000 * 60 * 60 * 24));
        
        history = [wordList[dayOfYear % wordList.length].toUpperCase()];
        draw();
        
        // Background load dictionary
        loadDictionary();
    }

    function loadDictionary() {
        fetch('https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt')
            .then(res => res.text())
            .then(text => {
                dictionary = text.toUpperCase().split('\n').map(w => w.trim());
                if (input) input.placeholder = "Type or use keyboard...";
                console.log("Dictionary Loaded");
            })
            .catch(err => {
                console.error("Dict Load Fail:", err);
                if (message) message.innerText = "Dictionary error. Please refresh.";
            });
    }

    // 3. KEYBOARD GENERATION
    function createKeyboard() {
        if (!keyboard) return;
        keyboard.innerHTML = ''; // Clear any existing keys

        const rows = [
            "QWERTYUIOP",
            "ASDFGHJKL",
            "ZXCVBNM"
        ];

        rows.forEach((row, i) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'keyboard-row';

            // Add ENTER key to the last row
            if (i === 2) {
                const enterKey = createKey("ENTER", "wide");
                enterKey.onclick = () => submitGuess();
                rowDiv.appendChild(enterKey);
            }

            row.split('').forEach(char => {
                const key = createKey(char);
                key.onclick = () => {
                    if (!isGameOver && input) {
                        input.value += char;
                        input.focus(); // Keep focus for desktop users
                    }
                };
                rowDiv.appendChild(key);
            });

            // Add BACKSPACE key to the last row
            if (i === 2) {
                const backKey = createKey("⌫", "wide");
                backKey.onclick = () => {
                    if (!isGameOver && input) {
                        input.value = input.value.slice(0, -1);
                        input.focus();
                    }
                };
                rowDiv.appendChild(backKey);
            }

            keyboard.appendChild(rowDiv);
        });
    }

    function createKey(label, className = "") {
        const btn = document.createElement('div');
        btn.className = `key ${className}`;
        btn.innerText = label;
        return btn;
    }

    function submitGuess() {
        if (isGameOver || !input) return;
        
        // If dictionary is still loading, wait
        if (dictionary.length === 0) {
            if (message) message.innerText = "Loading words... please wait.";
            return;
        }

        const guess = input.value.toUpperCase().trim();
        if (guess.length === 0) return;

        processGuess(guess);
        input.value = "";
    }

    function draw() {
        if (!stack) return;
        stack.innerHTML = history.slice().reverse().map((w, i) => {
            const op = i === 0 ? 1 : 0.5;
            return `<div class="word-card" style="opacity: ${op}">${w}</div>`;
        }).join('');
    }

    // Listen for physical keyboard
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') submitGuess();
        });
    }

    function processGuess(newWord) {
        const lastWord = history[history.length - 1];
        
        // Same logic as before
        const isOneLonger = newWord.length === lastWord.length + 1;
        const hasAnchor = newWord.endsWith(lastWord) || newWord.startsWith(lastWord);
        const inDictionary = dictionary.includes(newWord);

        if (isOneLonger && hasAnchor && inDictionary) {
            history.push(newWord);
            draw();
            if (message) {
                message.innerText = "Nice!";
                message.style.color = "#55ff55";
            }
        } else {
            handleFailure(newWord, isOneLonger, hasAnchor, inDictionary);
        }
    }

    function handleFailure(word, len, anc, dict) {
        isGameOver = true;
        if (input) {
            input.disabled = true;
            input.placeholder = "GAME OVER";
        }
        
        let reason = "Game Over! ";
        if (!len) reason += "Must be 1 letter longer.";
        else if (!anc) reason += "Previous word must be inside.";
        else if (!dict) reason += `"${word}" not in dictionary.`;

        if (message) {
            message.innerText = reason;
            message.style.color = "#ff5555";
            
            const scoreUI = document.createElement('div');
            scoreUI.style = "font-size: 2.5rem; font-weight: bold; margin: 20px 0; color: #ffd700;";
            scoreUI.innerText = `Final Chain: ${history.length}`;
            message.after(scoreUI);
        }

        if (shareBtn) {
            shareBtn.style.display = "block";
            setupShare(history.length);
        }
    }

    function setupShare(score) {
        shareBtn.onclick = () => {
            const text = `Bookends Daily 📈\nChain: ${score}\n${"🟩".repeat(score)}\n${window.location.href}`;
            navigator.clipboard.writeText(text);
            alert("Score copied!");
        };
    }

    // Run the game!
    init();
})();
