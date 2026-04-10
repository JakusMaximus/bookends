(function() {
    // --- 1. SET UP VARIABLES ---
    let dictionary = [];
    let history = [];
    let moveHistory = []; 
    let isGameOver = false;
    let selectedSide = null; 
    let pendingLetter = "";
    let isDictionaryLoaded = false;
    let lastFailedGuess = ""; 
    let streak = 0;

    // Grab HTML elements
    const stack = document.getElementById('word-stack');
    const activeDisplay = document.getElementById('active-word-display');
    const message = document.getElementById('message');
    const shareBtn = document.getElementById('share-btn');
    const keyboard = document.getElementById('keyboard');

    // --- 2. THE INITIALIZE FUNCTION ---
    function init() {
        console.log("Game Initializing...");
        
        // Load Streak FIRST so it's ready
        const savedStreak = localStorage.getItem('bookends_streak');
        streak = savedStreak ? parseInt(savedStreak) : 0;
        
        // Build the keyboard so the user sees something immediately
        createKeyboard();

        // 1. Logic to restore or start game
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
        } catch (e) {
            console.warn("Storage error:", e);
        }

        if (!loadedSuccessfully) {
            startFreshGame();
        }

        // 2. Load dictionary in the background
        loadDictionary();

        // 3. Draw the initial UI
        refreshUI();
    }

    function startFreshGame() {
        let wordList = ["CAT"]; 
        if (window.DAILY_STARTERS && Array.isArray(window.DAILY_STARTERS)) {
            wordList = window.DAILY_STARTERS.filter(w => w.length === 3);
        }
        
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const dayOfYear = Math.floor((now - start) / 86400000);
        
        history = [wordList[dayOfYear % wordList.length].toUpperCase()];
        moveHistory = [];
        isGameOver = false;
        lastFailedGuess = "";
    }

    // --- 3. THE CORE LOGIC ---
    function saveGameState() {
        try {
            const state = {
                history: history,
                moveHistory: moveHistory,
                isGameOver: isGameOver,
                lastFailedGuess: lastFailedGuess,
                date: new Date().toDateString() 
            };
            localStorage.setItem('bookends_daily_state', JSON.stringify(state));
        } catch (e) {
            console.error("Save failed:", e);
        }
    }

    function updateStreak() {
        const today = new Date();
        const todayStr = today.toDateString();
        const lastDateStr = localStorage.getItem('bookends_last_date');
        
        if (lastDateStr === todayStr) return; 

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (lastDateStr === yesterdayStr) {
            streak++; 
        } else {
            streak = 1; 
        }

        localStorage.setItem('bookends_streak', streak);
        localStorage.setItem('bookends_last_date', todayStr);
    }

    function loadDictionary() {
        if (message) message.innerText = "Loading dictionary...";
        fetch('https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt')
            .then(res => res.text())
            .then(text => {
                dictionary = text.toUpperCase().split('\n').map(w => w.trim());
                isDictionaryLoaded = true;
                validateCurrentStarter();
                if (message && !isGameOver) message.innerText = "Select a [+] to add a letter";
            })
            .catch(err => {
                if (message) message.innerText = "Error loading dictionary.";
                console.error(err);
            });
    }

    function validateCurrentStarter() {
        if (isGameOver || history.length > 1) return; 
        const starter = history[0];
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        let canReachFive = false;

        for (let char1 of alphabet) {
            const p4 = char1 + starter;
            const s4 = starter + char1;
            const possible4s = [];
            if (dictionary.includes(p4)) possible4s.push(p4);
            if (dictionary.includes(s4)) possible4s.push(s4);

            for (let word4 of possible4s) {
                for (let char2 of alphabet) {
                    if (dictionary.includes(char2 + word4) || dictionary.includes(word4 + char2)) {
                        canReachFive = true; break;
                    }
                }
                if (canReachFive) break;
            }
            if (canReachFive) break;
        }

        if (!canReachFive) {
            history = ["ACE"];
            refreshUI();
        }
    }

    window.selectSlot = function(side) {
        if (isGameOver || !isDictionaryLoaded) return;
        selectedSide = side;
        pendingLetter = ""; 
        if (message) message.innerText = "Select a letter for the " + side;
        refreshUI();
    };

    function handleKeyInput(char) {
        if (isGameOver || !selectedSide) return;
        pendingLetter = char;
        if (message) message.innerText = "Ready to submit?";
        refreshUI();
    }

    function submitMove() {
        if (isGameOver || !selectedSide || !pendingLetter || !isDictionaryLoaded) return;
        
        const lastWord = history[history.length - 1];
        const guess = selectedSide === 'prefix' ? pendingLetter + lastWord : lastWord + pendingLetter;

        if (dictionary.includes(guess)) {
            history.push(guess);
            moveHistory.push({side: selectedSide, success: true});
            selectedSide = null;
            pendingLetter = "";
            if (message) message.innerText = "Accepted!";
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

    // --- 4. UI UPDATES ---
    function refreshUI() {
        if (!history || history.length === 0) return;
        const lastWord = history[history.length - 1];
        
        // Word stack
        if (stack) {
            stack.innerHTML = history.slice(0, -1).reverse()
                .map(w => `<div class="word-card">${w}</div>`).join('');
        }
        
        // Active word
        if (activeDisplay) {
            activeDisplay.innerHTML = lastWord.split('')
                .map(l => `<div class="letter-tile">${l}</div>`).join('');
        }

        // Slots
        const pre = document.getElementById('slot-prefix');
        const suf = document.getElementById('slot-suffix');
        
        if (pre && suf) {
            if (isGameOver) {
                pre.style.visibility = "hidden";
                suf.style.visibility = "hidden";
            } else {
                pre.style.visibility = "visible";
                suf.style.visibility = "visible";
                pre.innerText = (selectedSide === 'prefix' && pendingLetter) ? pendingLetter : "+";
                suf.innerText = (selectedSide === 'suffix' && pendingLetter) ? pendingLetter : "+";
                pre.className = `slot ${selectedSide === 'prefix' ? 'selected' : ''} ${pendingLetter && selectedSide === 'prefix' ? 'filled' : ''}`;
                suf.className = `slot ${selectedSide === 'suffix' ? 'selected' : ''} ${pendingLetter && selectedSide === 'suffix' ? 'filled' : ''}`;
            }
        }

        if (isGameOver) {
            triggerGameOver(lastFailedGuess);
        }
    }

    function triggerGameOver(guess) {
        if (message) {
            message.innerText = (guess && guess !== "") 
                ? `"${guess}" isn't in our dictionary.` 
                : "Game Over!";
        }
        
        if (!document.querySelector('.final-score-text')) {
            const n = history.length;
            const scoreDiv = document.createElement('div');
            scoreDiv.className = "final-score-text";
            scoreDiv.innerHTML = `You reached Round ${n}.<br>
