(function() {
    let dictionary = [];
    let history = [];
    let isGameOver = false;
    let selectedSide = null; 
    let pendingLetter = "";

    const stack = document.getElementById('word-stack');
    const activeDisplay = document.getElementById('active-word-display');
    const message = document.getElementById('message');
    const shareBtn = document.getElementById('share-btn');
    const keyboard = document.getElementById('keyboard');

    function init() {
        createKeyboard();
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
            });
    }

    window.selectSlot = function(side) {
        if (isGameOver) return;
        selectedSide = side;
        pendingLetter = ""; 
        message.innerText = "Select a letter for the " + side;
        refreshUI();
    };

    function handleKeyInput(char) {
        if (isGameOver || !selectedSide) return;
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
            message.innerText = "Accepted!";
            refreshUI();
        } else {
            triggerGameOver(guess);
        }
    }

    function refreshUI() {
        const lastWord = history[history.length - 1];
        
        // Show previous words in order below
        stack.innerHTML = history.slice(0, -1).reverse()
            .map(w => `<div class="word-card">${w}</div>`).join('');

        activeDisplay.innerHTML = lastWord.split('')
            .map(l => `<div class="letter-tile">${l}</div>`).join('');

        const pre = document.getElementById('slot-prefix');
        const suf = document.getElementById('slot-suffix');
        if (pre && suf) {
            pre.innerText = (selectedSide === 'prefix' && pendingLetter) ? pendingLetter : "+";
            suf.innerText = (selectedSide === 'suffix' && pendingLetter) ? pendingLetter : "+";
            pre.className = `slot ${selectedSide === 'prefix' ? 'selected' : ''} ${pendingLetter && selectedSide === 'prefix' ? 'filled' : ''}`;
            suf.className = `slot ${selectedSide === 'suffix' ? 'selected' : ''} ${pendingLetter && selectedSide === 'suffix' ? 'filled' : ''}`;
        }
    }

    function triggerGameOver(guess) {
        isGameOver = true;
        message.innerText = `"${guess}" isn't in our dictionary.`;
        
        const n = history.length;
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        const suffix = (s[(v - 20) % 10] || s[v] || s[0]);
        
        const scoreDiv = document.createElement('div');
        scoreDiv.className = "final-score-text";
        scoreDiv.innerText = `You reached the ${n}${suffix} word.`;
        message.after(scoreDiv);
        shareBtn.style.display = "flex";
    }

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
                k.onclick = () => handleKeyInput(char);
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

    if (shareBtn) {
        shareBtn.onclick = () => {
            const text = `📖 Bookends Daily 📖\nI reached the ${history.length} word!\n${window.location.href}`;
            navigator.clipboard.writeText(text);
            alert("Score copied!");
        };
    }
    init();
})();
