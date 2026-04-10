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

    const stack = document.getElementById('word-stack');
    const activeDisplay = document.getElementById('active-word-display');
    const message = document.getElementById('message');
    const shareBtn = document.getElementById('share-btn');
    const keyboard = document.getElementById('keyboard');

    // --- 2. THE INITIALIZE FUNCTION ---
    function init() {
        createKeyboard();
        loadDictionary();

        let loadedSuccessfully = false;
        try {
            const saved = localStorage.getItem('bookends_daily_state');
            const today = new Date().toDateString();
            
            if (saved) {
                const state = JSON.parse(saved);
                // Only restore if the save is from TODAY
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

        // If no valid save for today, start fresh
        if (!loadedSuccessfully) {
            let wordList = ["CAT"]; 
            if (window.DAILY_STARTERS && Array.isArray(window.DAILY_STARTERS)) {
                wordList = window.DAILY_STARTERS;
            }
            const now = new Date();
            const start = new Date(now.getFullYear(), 0, 0);
            const dayOfYear = Math.floor((now - start) / 86400000);
            
            history = [wordList[dayOfYear % wordList.length].toUpperCase()];
            moveHistory = [];
            isGameOver = false;
            lastFailedGuess = "";
        }

        // Always refresh UI after logic is set
        refreshUI();
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

    function loadDictionary() {
        if (message) message.innerText = "Loading dictionary...";
        fetch('https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt')
            .then(res => res.text())
            .then(text => {
                dictionary = text.toUpperCase().split('\n').map(w => w.trim());
                isDictionaryLoaded = true;
                if (message && !isGameOver) message.innerText = "Select a [+] to add a letter";
            })
            .catch(err => {
                if (message) message.innerText = "Error. Please check connection.";
            });
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
            saveGameState();
            refreshUI(); 
        }
    }

    // --- 4. UI UPDATES ---
    function refreshUI() {
        // SAFETY: If history is empty for some reason, don't break the UI
        if (!history || history.length === 0) return;
        
        const lastWord = history[history.length - 1];
        
        // Show the list of previous words
        if (stack) {
            stack.innerHTML = history.slice(0, -1).reverse()
                .map(w => `<div class="word-card">${w}</div>`).join('');
        }
        
        // Show the tiles for the current active word
        if (activeDisplay) {
            activeDisplay.innerHTML = lastWord.split('')
                .map(l => `<div class="letter-tile">${l}</div>`).join('');
        }

        const pre = document.getElementById('slot-prefix');
        const suf = document.getElementById('slot-suffix');
        
        if (pre && suf) {
            if (isGameOver) {
                //
