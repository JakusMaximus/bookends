(function() {
    // 1. STATE
    let dictionary = [];
    let history = [];
    let isGameOver = false;

    const input = document.getElementById('word-input');
    const stack = document.getElementById('word-stack');
    const message = document.getElementById('message');
    const shareBtn = document.getElementById('share-btn');

    function init() {
        let wordList = ["CAT"]; 
        if (typeof DAILY_STARTERS !== 'undefined') wordList = DAILY_STARTERS;
        const now = new Date();
        const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
        
        history = [wordList[dayOfYear % wordList.length].toUpperCase()];
        draw();
        loadDictionary();
    }

    function loadDictionary() {
        fetch('https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt')
            .then(res => res.text())
            .then(text => {
                dictionary = text.toUpperCase().split('\n').map(w => w.trim());
                if (input) input.placeholder = "Grow the word...";
            });
    }

    function draw() {
        if (!stack) return;
        stack.innerHTML = history.slice().reverse().map((w, i) => {
            // Added a 'new-card' class for a CSS animation later
            const isNew = i === 0 && history.length > 1 ? 'new-card' : '';
            return `<div class="word-card ${isNew}">${w}</div>`;
        }).join('');
    }

    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !isGameOver) {
                const guess = input.value.toUpperCase().trim();
                const last = history[history.length - 1];

                if (guess.length === last.length + 1 && (guess.startsWith(last) || guess.endsWith(last)) && dictionary.includes(guess)) {
                    history.push(guess);
                    draw();
                    message.innerText = "Accepted!";
                    message.style.color = "#55ff55";
                    input.value = "";
                } else {
                    handleFailure(guess, last);
                }
            }
        });
    }

    function handleFailure(word, last) {
        isGameOver = true;
        input.disabled = true;
        input.placeholder = "GAME OVER";
        
        // Show the score
        const scoreUI = document.createElement('div');
        scoreUI.className = "final-score-container";
        scoreUI.innerHTML = `
            <div style="font-size: 1rem; color: #aaa;">FINAL CHAIN</div>
            <div style="font-size: 4rem; font-weight: bold; color: #ffd700;">${history.length}</div>
        `;
        message.after(scoreUI);

        // STREAK LOGIC
        updateStreak();

        if (shareBtn) {
            shareBtn.style.display = "block";
            setupShare(history.length);
        }
    }

    function updateStreak() {
        let streak = parseInt(localStorage.getItem('bookends_streak') || 0);
        const lastPlayed = localStorage.getItem('bookends_last_date');
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (lastPlayed === yesterday) {
            streak++;
        } else if (lastPlayed !== today) {
            streak = 1;
        }

        localStorage.setItem('bookends_streak', streak);
        localStorage.setItem('bookends_last_date', today);
        
        const streakMsg = document.createElement('p');
        streakMsg.innerText = `🔥 Day Streak: ${streak}`;
        message.after(streakMsg);
    }

    function setupShare(score) {
        shareBtn.onclick = () => {
            const text = `Bookends Daily 📈\nChain: ${score}\n${"🟩".repeat(score)}\nPlay here: ${window.location.href}`;
            navigator.clipboard.writeText(text);
            alert("Copied!");
        };
    }

    init();
})();
