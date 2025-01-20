// game.js

let currentGameInstance = null;
let isGameInitialized = false;
let hasIncrementedLoss = false;
let isGameActive = false;

async function createGame(options = {}) {
    console.log("Creating new game instance");
    if (isGameInitialized) {
        console.warn("A game is already running. Please end the current game before starting a new one.");
        return null;
    }

    const gameTab = document.getElementById('game');
    if (!gameTab) {
        console.error("Game container not found. Make sure there's an element with id 'game' in your HTML.");
        return null;
    }

    const { onGameStart = null } = options;

    gameTab.innerHTML = `
        <h1 class="display-4">Pong Game</h1>
        <p class="lead">Challenge yourself or play against the AI in our classic Pong game.</p>
        <div id="gameArea" class="mt-4"></div>
        <button id="startGameBtn" class="btn btn-success mt-3">Start Game</button>
    `;


    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    document.getElementById('gameArea').appendChild(canvas);

    const ctx = canvas.getContext('2d');

    // Game variables
    const paddleWidth = 10;
    const paddleHeight = 60;
    const ballSize = 10;
    const initialBallSpeed = 5;
    let player = { y: canvas.height / 2 - paddleHeight / 2, score: 0 };
    let ai = { y: canvas.height / 2 - paddleHeight / 2, score: 0, lastMoveTime: 0, targetY: canvas.height / 2 - paddleHeight / 2 };
    let ball = { x: canvas.width / 2, y: canvas.height / 2, dx: initialBallSpeed, dy: 0 };
    let animationFrameId = null;
    let isGameOver = false;

    // AI variables
    let aiReactionDelay = 0;
    let aiAccuracy = 0.9;
    let aiPredictionError = 0;
    let aiMovementSpeed = 4;

    // Game functions
    function drawRect(x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
    }

    function drawCircle(x, y, r, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2, false);
        ctx.closePath();
        ctx.fill();
    }

    function drawText(text, x, y, color) {
        ctx.fillStyle = color;
        ctx.font = '30px Arial';
        ctx.fillText(text, x, y);
    }

    function collision(b, p) {
        return b.y + ballSize > p.y && b.y - ballSize < p.y + paddleHeight;
    }

    function resetBall() {
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
        ball.dx = initialBallSpeed * (Math.random() > 0.5 ? 1 : -1);
        ball.dy = initialBallSpeed * (Math.random() * 2 - 1); // Random vertical direction
    }

    async function updateWinLossCount(isWin) {
        const endpoint = isWin ? 'http://localhost:8000/api/user/increment_wins/' : 'http://localhost:8000/api/user/increment_losses/';
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Failed to update win/loss count');
            }
            const data = await response.json();
            console.log(isWin ? `Wins updated: ${data.wins}` : `Losses updated: ${data.losses}`);
        } catch (error) {
            console.error('Error updating win/loss count:', error);
        }
    }

    async function incrementLossCount() {
        if (!hasIncrementedLoss) {
            await updateWinLossCount(false);
            hasIncrementedLoss = true;
        }
    }

    async function updateGame() {
        if (isGameOver) return;

        // Move the ball
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Ball collision with top and bottom walls
        if (ball.y - ballSize < 0 || ball.y + ballSize > canvas.height) {
            ball.dy = -ball.dy;
        }

        // Ball collision with paddles
        if (ball.x - ballSize < paddleWidth && collision(ball, player)) {
            ball.dx = Math.abs(ball.dx);
            let collidePoint = (ball.y - (player.y + paddleHeight / 2)) / (paddleHeight / 2);
            ball.dy = initialBallSpeed * 1.5 * collidePoint;
        } else if (ball.x + ballSize > canvas.width - paddleWidth && collision(ball, ai)) {
            ball.dx = -Math.abs(ball.dx);
            let collidePoint = (ball.y - (ai.y + paddleHeight / 2)) / (paddleHeight / 2);
            ball.dy = initialBallSpeed * 1.5 * collidePoint;
        }

        // AI paddle movement
        aiMove();

        // Scoring
        if (ball.x - ballSize < 0) {
            ai.score++;
            resetBall();
        } else if (ball.x + ballSize > canvas.width) {
            player.score++;
            resetBall();
        }

        // Check for game over
        if (player.score === 5 || ai.score === 5) {
            isGameOver = true;
            isGameActive = false;
            const playerWon = player.score === 5;
            await updateWinLossCount(playerWon);
            await recordMatchResult(player.score, ai.score);
            setTimeout(() => {
                alert(playerWon ? "You win!" : "AI wins!");
                player.s$core = ai.score = 0;
                resetBall();
                isGameOver = false;
                isGameInitialized = false;
                hasIncrementedLoss = false;
                updateUserStatus('online');
                document.getElementById('startGameBtn').style.display = 'block';
                drawGame();
            }, 100);
        }

        // Difficulty adjustment
        if (ai.score > player.score + 2) {
            aiAccuracy = Math.max(0.7, aiAccuracy - 0.05);
            aiMovementSpeed = Math.max(2, aiMovementSpeed - 0.5);
        } else if (player.score > ai.score + 2) {
            aiAccuracy = Math.min(0.95, aiAccuracy + 0.05);
            aiMovementSpeed = Math.min(6, aiMovementSpeed + 0.5);
        }
    }

    function drawGame() {
        // Clear canvas
        drawRect(0, 0, canvas.width, canvas.height, '#000');

        // Draw paddles
        drawRect(0, player.y, paddleWidth, paddleHeight, '#fff');
        drawRect(canvas.width - paddleWidth, ai.y, paddleWidth, paddleHeight, '#fff');

        // Draw ball
        drawCircle(ball.x, ball.y, ballSize, '#fff');

        // Draw scores
        drawText(player.score, canvas.width / 4, 50, '#fff');
        drawText(ai.score, 3 * canvas.width / 4, 50, '#fff');
    }

    function gameLoop() {
        if (!isGameInitialized || !isGameActive) return;
        updateGame();
        drawGame();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function aiMove() {
        const currentTime = Date.now();
        if (currentTime - ai.lastMoveTime >= 1000) { // Make decision every second
            // Introduce some randomness to the AI's reaction time
            aiReactionDelay = Math.random() * 200; // 0-200ms delay

            // Predict ball position with some error
            aiPredictionError = (Math.random() - 0.5) * canvas.height * 0.1; // ±5% of canvas height

            // Calculate target Y position with prediction error
            let timeToReach = (canvas.width - paddleWidth - ball.x) / ball.dx;
            let predictedY = ball.y + (ball.dy * timeToReach) + aiPredictionError;
            ai.targetY = predictedY - paddleHeight / 2;

            // Apply accuracy factor
            ai.targetY = ai.y + (ai.targetY - ai.y) * aiAccuracy;

            // Ensure AI paddle stays within the canvas
            ai.targetY = Math.max(0, Math.min(canvas.height - paddleHeight, ai.targetY));

            ai.lastMoveTime = currentTime;
        }

        // Move towards the target position with a delay
        if (currentTime - ai.lastMoveTime >= aiReactionDelay) {
            if (Math.abs(ai.y - ai.targetY) > aiMovementSpeed) {
                ai.y += ai.y < ai.targetY ? aiMovementSpeed : -aiMovementSpeed;
            } else {
                ai.y = ai.targetY; // Snap to target if very close
            }
        }

        // Ensure AI paddle stays within the canvas
        ai.y = Math.max(0, Math.min(canvas.height - paddleHeight, ai.y));
    }

    // Event listener for player paddle
    function handleMouseMove(e) {
        if (!isGameOver && isGameActive) {
            let rect = canvas.getBoundingClientRect();
            player.y = e.clientY - rect.top - paddleHeight / 2;
            // Ensure player paddle stays within the canvas
            player.y = Math.max(0, Math.min(canvas.height - paddleHeight, player.y));
        }
    }

    canvas.addEventListener('mousemove', handleMouseMove);

    // Page Visibility API
    async function handleVisibilityChange() {
        console.log('Visibility changed. Hidden:', document.hidden);
        console.log('Game state - Initialized:', isGameInitialized, 'Active:', isGameActive, 'Over:', isGameOver);

        if (document.hidden && isGameInitialized && isGameActive && !isGameOver && !hasIncrementedLoss) {
            console.log('Player left the game. Counting as a loss.');
            await incrementLossCount();
            isGameOver = true;
            isGameActive = false;
            cancelAnimationFrame(animationFrameId);
            alert("You left the game. This counts as a loss.");
            document.getElementById('startGameBtn').style.display = 'block';
        } else if (!document.hidden && isGameInitialized && isGameActive && !isGameOver) {
            console.log('Tab is visible again. Resuming game.');
            animationFrameId = requestAnimationFrame(gameLoop);
        }
        drawGame();
    }

    // Ensure we remove the previous event listener before adding a new one
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Start game button
    document.getElementById('startGameBtn').addEventListener('click', async () => {
        if (!isGameActive) {
            console.log('Start game button clicked');
            try {
                console.log('Sending request to increment games_played');
                const response = await fetch('http://localhost:8000/api/user/increment_games_played/', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to increment games played');
                }
                const data = await response.json();
                console.log('Response data:', data);

                isGameInitialized = true;
                isGameActive = true;
                hasIncrementedLoss = false;
                isGameOver = false;
                document.getElementById('startGameBtn').style.display = 'none';
                animationFrameId = requestAnimationFrame(gameLoop);
                if (typeof onGameStart === 'function') {
                    onGameStart();
                }
            } catch (error) {
                console.error('Error starting game:', error);
                alert('Failed to start the game. Please try again.');
            }
        } else {
            console.log('Game already active, ignoring click');
        }
    });

    // Initial draw
    drawGame();

    // Cleanup function
    function cleanup() {
        console.log("Cleanup function called");
        isGameInitialized = false;
        isGameActive = false;
        hasIncrementedLoss = false;
        isGameOver = false;
        cancelAnimationFrame(animationFrameId);
        canvas.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        gameTab.innerHTML = ''; // Clear the game area
    }

    // Return the cleanup function
    return cleanup;
}

async function recordMatchResult(playerScore, aiScore) {
    try {
        const response = await fetch('http://localhost:8000/api/record-match/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                opponent: 'AI',
                user_score: playerScore,
                opponent_score: aiScore,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to record match result');
        }
        const data = await response.json();
        console.log('Match recorded successfully:', data);
    } catch (error) {
        console.error('Error recording match result:', error);
    }
}

// Make sure initGame is available globally
window.initGame = function(options = {}) {
    console.log("Initializing new game");
    // Clean up any existing game before starting a new one
    if (currentGameInstance) {
        console.log("Cleaning up existing game");
        currentGameInstance();
        currentGameInstance = null;
    }
    // Start a new game and store the cleanup function
    currentGameInstance = createGame(options);
    updateUserStatus('playing');
    console.log("New game initialized, cleanup function stored");
};
