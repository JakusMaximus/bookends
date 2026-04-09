(function() {
    // 1. STATE MANAGEMENT
    let dictionary = [];
    let history = [];
    let isGameOver = false;
    let selectedSide = null; // 'prefix' or 'suffix'
    let pendingLetter = "";

    const stack = document.getElementById('word-stack');
    const activeDisplay = document.getElementById('active-word-display');
    const message = document.getElementById('message');
    const shareBtn = document.getElementById('share-btn');
    const keyboard = document.getElementById('keyboard');

    // 2. INIT
    function init() {
        createKeyboard();
        
        // Load Starters
        let wordList = ["CAT"]; 
        if (typeof DAILY_STARTERS !== 'undefined') wordList = DAILY_STARTERS;
        
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const dayOfYear = Math.floor((now - start) / 86400000);
        
        history = [wordList[dayOfYear % wordList.length].toUpperCase()];
        
        refreshUI();
        loadDictionary();
    }

    function loadDictionary() {
        fetch('https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt')
            .then(res => res.text())
            .then(text => {
                dictionary = text.toUpperCase().split('\n').map(w => w.trim());
                console.log("Dictionary Ready");
            });
    }

    // 3. UI RENDERING
    function refreshUI() {
        const lastWord = history[history.length - 1];

        // Draw the stack (excluding current word)
        stack.innerHTML = history.slice(0, -1).reverse()
            .map(w => `<div class="word-card">${w}</div>`).join('');

        // Draw active tiles
        activeDisplay.innerHTML = lastWord.split('')
            .map(l => `<div class="letter-tile">${l}</div>`).join('');

        // Update Slots
        const pre = document.getElementById('slot-prefix');
        const suf = document.getElementById('slot-suffix');

        if (pre && suf) {
            pre.innerText = (selectedSide === 'prefix' && pendingLetter) ? pendingLetter : "+";
            suf.innerText = (selectedSide === 'suffix' && pendingLetter) ? pendingLetter : "+";

            pre.className = `slot ${selectedSide === 'prefix' ? 'selected' : ''} ${pendingLetter && selectedSide === 'prefix' ? 'filled' : ''}`;
            suf.className = `slot ${selectedSide === 'suffix' ? 'selected' : ''} ${pendingLetter && selectedSide === 'suffix' ? 'filled' : ''}`;
        }
    }

    // 4. INTERACTION LOGIC
    window.selectSlot = function(side) {
        if (isGameOver) return;
        selectedSide = side;
        pendingLetter = ""; // Clear pending when switching sides
        message.innerText = "Now pick a letter...";
        message.style.color = "#ffffff";
        refreshUI();
    };

    function handleKey(char) {
        if (isGameOver) return;
        if (!selectedSide) {
            message.innerText = "Select a [+] slot first!";
            message.style.color = "#ffaa00";
            return;
        }
        pendingLetter = char;
        message.innerText = "Ready to submit?";
        refreshUI();
    }

    function submitMove() {
        if (isGameOver || !selectedSide || !pendingLetter) return;

        const lastWord = history[history.length - 1];
        const guess = selectedSide === 'prefix' ? pendingLetter + lastWord : lastWord + pendingLetter;

        if (dictionary.includes(guess)) {
            history.push(guess);
            selectedSide = null;
            pendingLetter = "";
            message.innerText = "Nice move!";
            message.style.color = "#55ff55";
            refreshUI();
        } else {
            triggerGameOver(guess);
        }
    }

    function triggerGameOver(guess) {
        isGameOver = true;
        message.innerText = `"${guess}" is not in the dictionary.`;
        message.style.color = "#ff5555";

        const scoreDiv = document.createElement('div');
        scoreDiv.className = "final-score";
        scoreDiv.innerText = history.length;
        message.after(scoreDiv);

        if (shareBtn) {
            shareBtn.style.display = "block";
            setupShare();
        }
    }

    // 5. KEYBOARD SETUP
    function createKeyboard() {
        const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
        keyboard.innerHTML = '';

        rows.forEach((row, i) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'keyboard-row';

            if (i === 2) {
                const sub = createKey("SUBMIT", "wide");
                sub.onclick = submitMove;
                rowDiv.appendChild(sub);
            }

            row.split('').forEach(char => {
                const k = createKey(char);
                k.onclick = () => handleKey(char);
                rowDiv.appendChild(k);
            });

            if (i === 2) {
                const back = createKey("⌫", "wide");
                back.onclick = () => { pendingLetter = ""; refreshUI(); };
                rowDiv.appendChild(back);
            }
            keyboard.appendChild(rowDiv);
        });
    }

    function createKey(label, cls) {
        const div = document.createElement('div');
        div.className = `key ${cls || ""}`;
        div.innerText = label;
        return div;
    }

    function setupShare() {
        shareBtn.onclick = () => {
            const text = `Bookends Daily 📈\nI grew the word to ${history.length} letters!\n${"🟩".repeat(history.length)}\n${window.location.href}`;
            navigator.clipboard.writeText(text);
            alert("Score copied to clipboard!");
        };
    }

    init();
})();
