(function() {
    let dictionary = [];
    let history = ["CAT"]; 
    let moveHistory = []; 
    let isGameOver = false;
    let selectedSide = null; 
    let pendingLetter = "";
    let isDictionaryLoaded = false;
    let lastFailedGuess = ""; 
    let streak = 0;

    const stackElem = document.getElementById('word-stack');
    const activeElem = document.getElementById('active-word-display');
    const msgElem = document.getElementById('message');
    const kbElem = document.getElementById('keyboard');
    const shareBtn = document.getElementById('share-btn');
    const tutorialElem = document.getElementById('tutorial-text');

    function init() {
        createKeyboard();
        streak = parseInt(localStorage.getItem('bookends_streak')) || 0;
        let loadedSuccessfully = false;
        try {
            const saved = localStorage.getItem('bookends_daily_state');
            const today = new Date().toDateString();
            if (saved) {
                const state = JSON.parse(saved);
                if (state && state.date === today) {
                    history = state.history || ["CAT"];
                    moveHistory = state.moveHistory || [];
                    isGameOver = state.isGameOver || false;
                    lastFailedGuess = state.lastFailedGuess || ""; 
                    loadedSuccessfully = true;
                }
            }
        } catch (e) { console.warn("Restore failed"); }
        if (!loadedSuccessfully) startFreshGame();
        loadDictionary();
        refreshUI();
    }

    function startFreshGame() {
        let wordList = ["CAT", "DOG", "ACE"]; 
        if (window.DAILY_STARTERS && Array.isArray(window.DAILY_STARTERS)) {
            wordList = window.DAILY_STARTERS.filter(w => w.length === 3);
        }
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const dayOfYear = Math.floor((now - start) / 86400000);
        history = [wordList[dayOfYear % wordList.length].toUpperCase()];
        moveHistory = [];
        isGameOver = false;
    }

    function loadDictionary() {
        fetch('https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt')
            .then(res => res.text())
            .then(text => {
                dictionary = text.toUpperCase().split('\n').map(w => w.trim());
                isDictionaryLoaded = true;
                validateCurrentStarter();
                if (msgElem && !isGameOver) msgElem.innerText = "Select a side to play";
            });
    }

    function validateCurrentStarter() {
        if (isGameOver || history.length > 1 || !isDictionaryLoaded) return;
        const starter = history[0];
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        let valid = false;
        for (let c of alphabet) {
            if (dictionary.includes(c + starter) || dictionary.includes(starter + c)) {
                valid = true; break;
            }
        }
        // ROTATING SAFETY LOGIC: If dead end, pick a daily-rotating power word
        if (!valid) {
            const powerStarters = ["ACE", "ART", "INK", "OIL", "EAR", "AMP", "END", "AIR", "OLD", "ALL", "ICE", "ORE"];
            const now = new Date();
            const start = new Date(now.getFullYear(), 0, 0);
            const dayOfYear = Math.floor((now - start) / 86400000);
            history = [powerStarters[dayOfYear % powerStarters.length]];
            refreshUI();
        }
    }

    window.selectSlot = function(side) {
        if (isGameOver || !isDictionaryLoaded) return;
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
        if (isGameOver || !selectedSide || !pendingLetter || !isDictionaryLoaded) return;
        const lastWord = history[history.length - 1];
        const guess = selectedSide === 'prefix' ? pendingLetter + lastWord : lastWord + pendingLetter;
        if (dictionary.includes(guess)) {
            history.push(guess);
            moveHistory.push({side: selectedSide, success: true});
            selectedSide = null; pendingLetter = "";
            saveGameState();
            refreshUI();
        } else {
            isGameOver = true;
            lastFailedGuess = guess; 
            moveHistory.push({side: selectedSide, success: false});
            updateStreak();
            saveGameState();
            refreshUI(); 
        }
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

    function saveGameState() {
        const state = { history, moveHistory, isGameOver, lastFailedGuess, date: new Date().toDateString() };
        localStorage.setItem('bookends_daily_state', JSON.stringify(state));
    }

    function refreshUI() {
        if (tutorialElem) {
            tutorialElem.style.display = (history.length > 1 || isGameOver) ? "none" : "block";
        }
        const lastWord = history[history.length - 1];
        if (activeElem) {
            activeElem.innerHTML = lastWord.split('').map(l => `<div class="letter-tile">${l}</div>`).join('');
        }
        if (stackElem) {
            stackElem.innerHTML = history.slice(0, -1).reverse().map(w => `<div class="word-card">${w}</div>`).join('');
        }
        const pre = document.getElementById('slot-prefix');
        const suf = document.getElementById('slot-suffix');
        if (pre && suf) {
            if (isGameOver) {
                pre.style.visibility = "hidden"; suf.style.visibility = "hidden";
            } else {
                pre.style.visibility = "visible"; suf.style.visibility = "visible";
                pre.innerText = (selectedSide === 'prefix') ? pendingLetter : "";
                suf.innerText = (selectedSide === 'suffix') ? pendingLetter : "";
                pre.className = `slot ${selectedSide === 'prefix' ? 'selected' : ''} ${pendingLetter && selectedSide === 'prefix' ? 'filled' : ''}`;
                suf.className = `slot ${selectedSide === 'suffix' ? 'selected' : ''} ${pendingLetter && selectedSide === 'suffix' ? 'filled' : ''}`;
            }
        }
        if (isGameOver) triggerGameOver();
    }

    function triggerGameOver() {
        if (msgElem) msgElem.innerText = `"${lastFailedGuess}" failed!`;
        if (!document.querySelector('.final-score-text')) {
            const scoreDiv = document.createElement('div');
            scoreDiv.className = "final-score-text";
            scoreDiv.innerHTML = `Round ${history.length}<br>Streak: ${streak}🔥`;
            if (msgElem) msgElem.after(scoreDiv);
        }
        if (shareBtn) shareBtn.style.display = "flex";
        if (kbElem) kbElem.style.opacity = "0.5";
    }

    function createKeyboard() {
        if (!kbElem) return;
        const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
        kbElem.innerHTML = '';
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
                const back = document.createElement('div');
                back.className = "key wide"; back.innerText = "⌫";
                back.onclick = () => { pendingLetter = ""; refreshUI(); }; rowDiv.appendChild(back);
            }
            kbElem.appendChild(rowDiv);
        });
    }

    if (shareBtn) {
        shareBtn.onclick = () => {
            const text = `📖 Bookends Daily 📖\nRound: ${history.length} | Streak: ${streak}🔥\n${window.location.href}`;
            navigator.clipboard.writeText(text);
            alert("Copied results!");
        };
    }

    init();
})();
