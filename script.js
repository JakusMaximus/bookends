(function() {
    let dictionary = [];
    let history = [];
    let isGameOver = false;

    const input = document.getElementById('word-input');
    const stack = document.getElementById('word-stack');
    const message = document.getElementById('message');
    const shareBtn = document.getElementById('share-btn');
    const keyboard = document.getElementById('keyboard');

    function init() {
        let wordList = ["CAT"]; 
        if (typeof DAILY_STARTERS !== 'undefined') wordList = DAILY_STARTERS;
        const now = new Date();
        const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
        
        history = [wordList[dayOfYear % wordList.length].toUpperCase()];
        draw();
        loadDictionary();
        createKeyboard(); // Initialize the visual keys
    }

    function loadDictionary() {
        fetch('https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt')
            .then(res => res.text())
            .then(text => {
                dictionary = text.toUpperCase().split('\n').map(w => w.trim());
                if (input) input.placeholder = "Type or use keyboard...";
            });
    }

    // --- KEYBOARD LOGIC START ---
    function createKeyboard() {
        const rows = [
            "QWERTYUIOP",
            "ASDFGHJKL",
            "ZXCVBNM"
        ];

        rows.forEach((row, i) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'keyboard-row';

            // Add ENTER key to the middle or last row
            if (i === 2) {
                const enterKey = createKey("ENTER", "wide");
                enterKey.onclick = () => submitGuess();
                rowDiv.appendChild(enterKey);
            }

            row.split('').forEach(char => {
                const key = createKey(char);
                key.onclick = () => {
                    if (!isGameOver) input.value += char;
                };
                rowDiv.appendChild(key);
            });

            // Add BACKSPACE key to the last row
            if (i === 2) {
                const backKey = createKey("⌫", "wide");
                backKey.onclick = () => {
                    if (!isGameOver) input.value = input.value.slice(0, -1);
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
        if (isGameOver) return;
        const guess = input.value.toUpperCase().trim();
        processGuess(guess);
        input.value = "";
    }
    // --- KEYBOARD LOGIC END ---

    function draw() {
        if (!stack) return;
        stack.innerHTML = history.slice().reverse().map((w, i) => {
            const op = i === 0 ? 1 : 0.5;
            return `<div class="word-card" style="opacity: ${op}">${w}</div>`;
        }).join('');
    }

    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') submitGuess();
        });
    }

    function processGuess(newWord) {
        const lastWord = history[history.length - 1];
        const isOneLonger = newWord.length === lastWord.length + 1;
        const hasAnchor = newWord.endsWith(lastWord) || newWord.startsWith(lastWord);
        const inDictionary = dictionary.includes(newWord);

        if (isOneLonger && hasAnchor && inDictionary) {
            history.push(newWord);
            draw();
            message.innerText = "Accepted!";
            message.style.color = "#55ff55";
        } else {
            handleFailure(newWord, isOneLonger, hasAnchor, inDictionary);
        }
    }

    function handleFailure(word, len, anc, dict) {
        isGameOver = true;
        input.disabled = true;
        input.placeholder = "GAME OVER";
        
        let reason = "";
        if (!len) reason = "Must be 1 letter longer.";
        else if (!anc) reason = "Must contain the previous word.";
        else if (!dict) reason = `"${word}" is not in our dictionary.`;

        message.innerText = reason;
        message.style.color = "#ff5555";

        const scoreUI = document.createElement('div');
        scoreUI.style = "font-size: 2.5rem; font-weight: bold; margin: 20px 0; color: #ffd700;";
        scoreUI.innerText = `Final Chain: ${history.length}`;
        message.after(scoreUI);

        if (shareBtn) {
            shareBtn.style.display = "block";
            setupShare(history.length);
        }
    }

    function setupShare(score) {
        shareBtn.onclick = () => {
            const text = `Bookends Daily 📈\nChain: ${score} words\n${"🟩".repeat(score)}\n${window.location.href}`;
            navigator.clipboard.writeText(text);
            alert("Score copied!");
        };
    }

    init();
})();
