(function() {
    // 1. STATE
    let dictionary = [];
    let history = [];
    let gameActive = true;

    const input = document.getElementById('word-input');
    const stack = document.getElementById('word-stack');
    const message = document.getElementById('message');
    const shareBtn = document.getElementById('share-btn');

    function initGame() {
        const dailyWord = getDailyWord();
        history = [dailyWord];
        renderStack();
        loadDictionary();
    }

    function getDailyWord() {
        let wordList = ["CAT"]; 
        if (typeof DAILY_STARTERS !== 'undefined') wordList = DAILY_STARTERS;
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start;
        const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
        return wordList[dayOfYear % wordList.length].toUpperCase();
    }

    function loadDictionary() {
        fetch('https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt')
            .then(res => res.text())
            .then(text => {
                dictionary = text.toUpperCase().split('\n').map(w => w.trim());
                if (input) input.placeholder = "Grow the word...";
            });
    }

    function renderStack() {
        if (!stack) return;
        stack.innerHTML = history.slice().reverse().map((w, i) => {
            // Newest word is bright, older words fade out
            const op = i === 0 ? 1 : 0.6 - (i * 0.05);
            return `<div class="word-card" style="opacity: ${op}">${w}</div>`;
        }).join('');
    }

    if (input) {
        input.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && gameActive) {
                const newWord = input.value.toUpperCase().trim();
                processGuess(newWord);
                input.value = '';
            }
        });
    }

    function processGuess(newWord) {
        const lastWord = history[history.length - 1];

        // The 3 Rules of the Game
        const isOneLonger = newWord.length === lastWord.length + 1;
        const hasAnchor = newWord.endsWith(lastWord) || newWord.startsWith(lastWord);
        const inDictionary = dictionary.includes(newWord);

        // STRIKE SYSTEM: If any of these are false, the game ends immediately
        if (isOneLonger && hasAnchor && inDictionary) {
            history.push(newWord);
            renderStack();
            message.innerText = "Nice! +1 Word";
            message.style.color = "#55ff55";
        } else {
            // Determine the specific reason for failure
            let reason = "";
            if (!isOneLonger) reason = "Must add exactly 1 letter.";
            else if (!hasAnchor) reason = `Must contain "${lastWord}".`;
            else if (!inDictionary) reason = `"${newWord}" is not in our dictionary.`;
            
            endGame(reason);
        }
    }

    function endGame(reason) {
        gameActive = false;
        input.disabled = true;
        input.placeholder = "GAME OVER";
        
        message.innerText = reason;
        message.style.color = "#ff5555";

        // Create a visual "Final Score" badge
        const scoreBox = document.createElement('div');
        scoreBox.style.marginTop = "20px";
        scoreBox.innerHTML = `
            <div style="font-size: 0.9rem; color: #888;">FINAL CHAIN</div>
            <div style="font-size: 3rem; font-weight:
