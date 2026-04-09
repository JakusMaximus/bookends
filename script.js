(function() {
    // 1. GAME STATE
    let dictionary = [];
    let history = [];
    let isGameOver = false;

    const input = document.getElementById('word-input');
    const stack = document.getElementById('word-stack');
    const message = document.getElementById('message');
    const shareBtn = document.getElementById('share-btn');

    // 2. INITIALIZE
    function init() {
        // Setup the starter word
        let wordList = ["CAT"]; 
        if (typeof DAILY_STARTERS !== 'undefined') wordList = DAILY_STARTERS;
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const dayOfYear = Math.floor((now - start) / (1000 * 60 * 60 * 24));
        
        history = [wordList[dayOfYear % wordList.length].toUpperCase()];
        draw();
        
        // Background load dictionary
        fetch('https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt')
            .then(res => res.text())
            .then(text => {
                dictionary = text.toUpperCase().split('\n').map(w => w.trim());
                if (input) input.placeholder = "Type your next word...";
                console.log("Dictionary Loaded");
            });
    }

    // 3. RENDER THE STACK
    function draw() {
        if (!stack) return;
        stack.innerHTML = history.slice().reverse().map((w, i) => {
            const op = i === 0 ? 1 : 0.5;
            return `<div class="word-card" style="opacity: ${op}">${w}</div>`;
        }).join('');
    }

    // 4. MAIN INPUT LOGIC
    if (input) {
        input.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                if (isGameOver) return; // Stop if game ended

                const guess = input.value.toUpperCase().trim();
                const last = history[history.length - 1];

                // Check Rules
                const validLen = (guess.length === last.length + 1);
                const validAnc = (guess.startsWith(last) || guess.endsWith(last));
                const inDict = dictionary.includes(guess);

                if (validLen && validAnc && inDict) {
                    // CONTINUE GAME
                    history.push(guess);
                    draw();
                    message.innerText = "Accepted!";
                    message.style.color = "#55ff55";
                    input.value = "";
                } else {
                    // TERMINATE GAME
                    handleFailure(guess, validLen, validAnc, inDict);
                }
            }
        });
    }

    // 5. THE END OF THE LINE
    function handleFailure(word, len, anc, dict) {
        isGameOver = true;
        input.disabled = true;
        input.value = "";
        input.placeholder = "GAME OVER";

        // Why did they lose?
        let failReason = "";
        if (!len) failReason = "Length error: Must be 1 letter longer.";
        else if (!anc) failReason = "Anchor error: The previous word must be inside your new word.";
        else if (!dict) failReason = `"${word}" is not a valid English word.`;

        message.innerText = failReason;
        message.style.color = "#ff5555";

        // Show Big Score
        const scoreUI = document.createElement('div');
        scoreUI.style = "font-size: 2.5rem; font-weight: bold; margin: 20px 0; color: #ffd700;";
        scoreUI.innerText = `Final Chain: ${history.length}`;
        message.after(scoreUI);

        // Setup Share
        if (shareBtn) {
            shareBtn.style.display = "block";
            shareBtn.style.margin = "20px auto";
            shareBtn.onclick = () => {
                const text = `Bookends Daily 📈\nChain: ${history.length} words\n${"🟩".repeat(history.length)}\n${window.location.href}`;
                navigator.clipboard.writeText(text);
                alert("Score copied!");
            };
        }
    }

    init();
})();
