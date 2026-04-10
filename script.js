(function() {
    // --- 1. SET UP VARIABLES ---
    let dictionary = [];
    let history = ["???"]; // Placeholder so it's never empty
    let moveHistory = []; 
    let isGameOver = false;
    let selectedSide = null; 
    let pendingLetter = "";
    let isDictionaryLoaded = false;
    let lastFailedGuess = ""; 
    let streak = 0;

    // --- 2. THE INITIALIZE FUNCTION ---
    function init() {
        // Build keyboard first so UI isn't blank
        createKeyboard();

        // Load streak
        streak = parseInt(localStorage.getItem('bookends_streak')) || 0;

        let loadedSuccessfully = false;
        try {
            const saved = localStorage.getItem('bookends_daily_state');
            const today = new Date().toDateString();
            if (saved) {
                const state = JSON.parse(saved);
                if (state && state.date === today) {
                    history = state.history || [];
                    moveHistory = state.moveHistory || [];
                    isGameOver = state.isGameOver || false;
                    lastFailedGuess = state.lastFailedGuess || ""; 
                    loadedSuccessfully = true;
                }
            }
        } catch (e) { console.warn("Save load failed"); }

        if (!loadedSuccessfully) {
            startFreshGame();
        }

        loadDictionary();
        refreshUI();
    }

    function startFreshGame() {
        let wordList = ["CAT"]; 
        if (window.DAILY_STARTERS) {
            wordList = window.DAILY_STARTERS.filter(w => w.length === 3);
        }
        const now = new Date();
        const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
        history = [wordList[dayOfYear % wordList.length].toUpperCase()];
        moveHistory = [];
        isGameOver = false;
    }

    // --- 3. CORE LOGIC ---
    function loadDictionary() {
        const msg = document.getElementById('message');
        if (msg) msg.innerText = "Loading...";
        fetch('https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt')
            .then(res => res.text())
            .then(text => {
                dictionary = text.toUpperCase().split('\n').map(w => w.trim());
                isDictionaryLoaded = true;
                validateCurrentStarter();
                if (msg && !isGameOver) msg.innerText = "Select a [+] to begin";
            }).catch(() => { if (msg) msg.innerText = "Offline Mode"; });
    }

    function validateCurrentStarter() {
        if (isGameOver || history.length > 1 || !isDictionaryLoaded) return;
        // Simple check for 4-letter path
        const starter = history[0];
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        let valid = false;
        for (let c of alphabet) {
            if (dictionary.includes(c + starter) || dictionary.includes(starter + c)) {
                valid = true; break;
            }
        }
        if (!valid) { history = ["ACE"]; refreshUI(); }
    }

    window.selectSlot = function(side) {
        if (isGameOver) return;
        selectedSide = side;
        pendingLetter = ""; 
        refreshUI();
    };

    function handleKeyInput(char) {
        if (isGameOver || !selectedSide) return;
        pendingLetter = char;
        refreshUI();
    }

    function submitMove() {
        if (isGameOver || !selectedSide || !pendingLetter) return;
        const lastWord = history[history.length - 1];
        const guess = selectedSide === 'prefix' ? pendingLetter + lastWord : lastWord + pendingLetter;

        if (dictionary.includes(guess)) {
            history.push(guess);
            moveHistory.push({side: selectedSide, success: true});
            selectedSide = null; pendingLetter = "";
        } else {
            isGameOver = true;
            lastFailedGuess = guess; 
            moveHistory.push({side: selectedSide, success: false});
            updateStreak();
        }
        saveGameState();
        refreshUI();
    }

    function saveGameState() {
        const state = { history, moveHistory, isGameOver, lastFailedGuess, date: new Date().toDateString() };
        localStorage.setItem('bookends_daily_state', JSON.stringify(state));
    }

    function updateStreak() {
        const today = new Date().toDateString();
        const lastDate = localStorage.getItem('bookends_last_date');
        if (lastDate === today) return;
        
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        if (lastDate === yesterday.toDateString()) streak++; else streak = 1;

        localStorage.setItem('bookends_streak', streak);
        localStorage.setItem('bookends_last_date', today);
    }

    // --- 4. UI DRAWING (THE CRITICAL PART) ---
    function refreshUI() {
        const lastWord = history[history.length - 1];
        
        // 1. Current Word Tiles
        const active = document.getElementById('active-word-display');
        if (active) {
            active.innerHTML = lastWord.split('').map(l => `<div class="letter-tile">${l}</div>`).join('');
        }

        // 2. Previous Words Stack
        const stack = document.getElementById('word-stack');
        if (stack) {
            stack.innerHTML = history.slice(0, -1).reverse().map(w => `<div class="word-card">${w}</div>`).join('');
        }

        // 3. The Slots (+ signs)
        const pre = document.getElementById('slot-prefix');
        const suf = document.getElementById('slot-suffix');
        if (pre && suf) {
            if (isGameOver) {
                pre.style.visibility = "hidden"; suf.style.visibility = "hidden";
            } else {
                pre.style.visibility = "visible"; suf.style.visibility = "visible";
                pre.innerText = (selectedSide === 'prefix' && pendingLetter) ? pendingLetter : "+";
                suf.innerText = (selectedSide === 'suffix' && pendingLetter) ? pendingLetter : "+";
                pre.className = `slot ${selectedSide === 'prefix' ? 'selected' : ''} ${pendingLetter && selectedSide === 'prefix' ? 'filled' : ''}`;
                suf.className = `slot ${selectedSide === 'suffix' ? 'selected' : ''} ${pendingLetter && selectedSide === 'suffix' ? 'filled' : ''}`;
            }
        }

        if (isGameOver) triggerGameOver();
    }

    function triggerGameOver() {
        const msg = document.getElementById('message');
        if (msg) msg.innerText = `"${lastFailedGuess}" failed!`;
        
        if (!document.querySelector('.final-score-text')) {
            const scoreDiv = document.createElement('div');
            scoreDiv.className = "final-score-text";
            scoreDiv.innerHTML = `Round ${history.length}<br>Streak: ${streak}🔥`;
            if (msg) msg.after(scoreDiv);
        }
        const btn = document.getElementById('share-btn');
        if (btn) btn.style.display = "flex";
        const kb = document.getElementById('keyboard');
        if (kb) kb.style.opacity = "0.5";
    }

    function createKeyboard() {
        const kb = document.getElementById('keyboard');
        if (!kb) return;
        const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
        kb.innerHTML = '';
        rows.forEach((row, i) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'keyboard-row';
            if (i === 2) {
                const sub = document.createElement('div');
                sub.className = "key wide"; sub.innerText = "SUBMIT";
                sub.onclick = submitMove; rowDiv.appendChild(sub);
            }
            row.split('').forEach(char => {
                const k = document.createElement('div');
                k.className = "key"; k.innerText = char;
                k.onclick = () => handleKeyInput(char); rowDiv.appendChild(k);
            });
            if (i === 2) {
                const back = document.createElement
