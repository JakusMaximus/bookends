(function() {
    let dictionary = [];
    let history = [];
    let moveHistory = []; // Tracks if letter was 'prefix' or 'suffix'
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
        loadDictionary();

        // 1. Check for a saved game in the browser's memory
        const saved = localStorage.getItem('bookends_daily_state');
        const today = new Date().toDateString();
        
        if (saved) {
            const state = JSON.parse(saved);
            // Only load the save if it was made TODAY
            if (state.date === today) {
                history = state.history;
                moveHistory = state.moveHistory;
                isGameOver = state.isGameOver;
                
                if (isGameOver) {
                    // If they already finished today, show the results immediately
                    triggerGameOver("the last word", true); 
                }
                
                refreshUI();
                return; // Stop here, we've successfully restored the game
            }
        }

        // 2. If no save exists for today, start a fresh game
        let wordList = ["CAT"]; 
        if (typeof DAILY_STARTERS !== 'undefined') wordList = DAILY_STARTERS;
        
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const dayOfYear = Math.floor((now - start) / 86400000);
        
        history = [wordList[dayOfYear % wordList.length].toUpperCase()];
        moveHistory = [];
        isGameOver = false;
        
        refreshUI();
    }

    // This function saves your progress to the browser's local storage
    function saveGameState() {
        const state = {
            history: history,
            moveHistory: moveHistory,
            isGameOver: isGameOver,
            date: new Date().toDateString() 
        };
        localStorage.setItem('bookends_daily_state', JSON.stringify(state));
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
            moveHistory.push({side: selectedSide, success: true});
            selectedSide = null;
            pendingLetter = "";
            message.innerText = "Accepted!";
            saveGameState(); // Save progress after a good move
            refreshUI();
        } else {
            moveHistory.push({side: selectedSide, success: false});
            saveGameState(); // Save that the game ended
            triggerGameOver(guess);
        }
    }

    function refreshUI() {
        const lastWord = history[history.length - 1];
        
        // Update the list of previous words
        stack.innerHTML = history.slice(0, -1).reverse()
            .map(w => `<div class="word-card">${w}</div>`).join('');
            
        // Update the main word tiles
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

    function triggerGameOver(guess, isRestoring = false) {
        isGameOver = true;
        
        if (isRestoring) {
            message.innerText = "Game Over! Here is your final score:";
        } else {
            message.innerText = `"${guess}" isn't in our dictionary.`;
        }
        
        // Only add the score text if it isn't already there
        if (!document.querySelector('.final-score-text')) {
            const n = history.length;
            const s = ["th", "st", "nd", "rd"];
            const v = n % 100;
            const suffix = (s[(v - 20) % 10] || s[v] || s[0]);
            
            const scoreDiv = document.createElement('div');
            scoreDiv.className = "final-score-text";
            scoreDiv.innerText = `You reached the ${n}${suffix} word.`;
            message.after(scoreDiv);
        }
        
        shareBtn.style.display = "flex";
    }

    function generateShareGrid() {
        let grid = "";
        let currentLen = history[0].length;
        
        // Start word row
        grid += "⬜".repeat(currentLen) + "\n";
        
        moveHistory.forEach(move => {
            const block = move.success ? "🟦" : "🟥";
            if (move.side === 'prefix') {
                grid += block + "🟩".repeat(currentLen) + "\n";
            } else {
                grid += "🟩".repeat(currentLen) + block + "\n";
            }
            if (move.success) currentLen++;
        });
        return grid;
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
        shareBtn
