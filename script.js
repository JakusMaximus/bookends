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
            return `<div class="word-card" style="opacity: ${1 - (i * 0.1)}">${w}</div>`;
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

        // LOGIC CHECK: Is it 1 letter longer and does it contain the anchor?
        const isOneLonger = newWord.length === lastWord.length + 1;
        const hasAnchor = newWord.endsWith(lastWord) || newWord.startsWith(lastWord);
        const inDictionary = dictionary.includes(newWord);

        if (isOneLonger && hasAnchor && inDictionary) {
            // SUCCESS
            history.push(newWord);
            renderStack();
            message.innerText = "Nice! Keep going...";
            message.style.color = "#55ff55";
        } else {
            // GAME OVER
            endGame(newWord, isOneLonger, hasAnchor, inDictionary);
        }
    }

    function endGame(word, len, anc, dict) {
        gameActive = false;
        input.disabled = true;
        input.placeholder = "Game Over";

        let reason = "Game Over! ";
        if (!len) reason += "Must add exactly 1 letter.";
        else if (!anc) reason += "Must add to the start or end.";
        else if (!dict) reason += `"${word}" isn't in our dictionary.`;

        message.innerText = reason;
        message.style.color = "#ff5555";

        // Show Final Score
        const finalScore = history.length;
        const scoreDisplay = document.createElement('div');
        scoreDisplay.innerHTML = `<h2 style="margin-top:20px;">Final Chain: ${finalScore}</h2>`;
        message.parentNode.insertBefore(scoreDisplay, message.nextSibling);

        // Show Share Button
        if (shareBtn) {
            shareBtn.style.display = 'block';
            setupShare(finalScore);
        }
    }

    function setupShare(score) {
        shareBtn.onclick = () => {
            const boxes = "🟩".repeat(score);
            const text = `Bookends Daily 📈\nMy chain: ${score} words\n${boxes}\n${window.location.href}`;
            navigator.clipboard.writeText(text);
            alert("Score copied to clipboard! Share it with friends.");
        };
    }

    initGame();
})();
