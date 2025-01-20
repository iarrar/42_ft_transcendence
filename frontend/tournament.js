let players = [];

let P1isUpPressed = false;
let P1isDownPressed = false;
let P2isUpPressed = false;
let P2isDownPressed = false;


let isGameOver = false;


let TcurrentGameInstance = null;
let TisGameInitialized = false;
let ThasIncrementedLoss = false;
let TisGameActive = false;


function initTournament() {
    const tournamentTab = document.getElementById('tournament');

    tournamentTab.innerHTML = `
        <h1 class="display-4">Tournament</h1>
        <p class="lead">Join our exciting tournaments and win amazing prizes!</p>
        <hr class="my-4">
        <p>Check out the upcoming tournaments or view the results of past ones.</p>
        <div class="mb-3">
            <label for="playerName" class="form-label">Player Name</label>
            <input type="text" id="playerName" class="form-control" placeholder="Enter player name">
        </div>
        <button id="addPlayerBtn" class="btn btn-primary mb-3">Add Player</button>
        <h3>Players:</h3>
        <ul id="playerList" class="list-group mb-4"></ul>
        <button id="joinTournamentBtn" class="btn btn-success">Join Tournament</button>
    `;

    console.log("Tournament debug : " , tournamentTab);
    console.log("Tournament initialized!");


    document.getElementById('addPlayerBtn').addEventListener('click', () => {
    const playerNameInput = document.getElementById('playerName');
    const playerName = playerNameInput.value.trim();

    if (playerName) {
        players.push(playerName);

        // Mettre à jour la liste des joueurs affichée
        const playerList = document.getElementById('playerList');
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item';
        listItem.textContent = playerName;
        playerList.appendChild(listItem);

         // Vider le champ de saisie après l'ajout
        playerNameInput.value = '';
    }
    });


    document.getElementById('joinTournamentBtn').addEventListener('click', () => {
    if (players.length > 1) {
        console.log("Players joining the tournament:");
        players.forEach(player => console.log(player));
        console.log("Start the tournament");
        startTournament(players);
    } else {
        console.log("No enough players have been added yet.");
    }
	});


    console.log("Tournament debug : " , tournamentTab);
}

function startTournament(players) {
    console.log("Starting the tournament with the following players:");
    console.log(players);

    // Mélanger les joueurs pour créer un ordre aléatoire
    players = shuffleArray(players);
    playRound(players);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}


function playRound(Tplayers) {
    console.log("New Round Starting!");
    const winners = [];

    const playMatch = async (player1, player2) => {
        console.log(`Starting match between ${player1} and ${player2}`);

        // Start the game and wait for the winner to be determined
        const winner = await startGameWithPlayers(player1, player2);
        winners.push(winner);
        console.log(`${player1} vs ${player2} - Winner: ${winner}`);
    };



    const handleRound = async () => {
        while (Tplayers.length > 1) {
            const player1 = Tplayers.pop();
            const player2 = Tplayers.pop();

            await playMatch(player1, player2);
        }


    // Si le nombre de joueurs est impair, le dernier joueur est qualifié d'office
    if (Tplayers.length === 1) {
        winners.push(Tplayers.pop());
    }

    if (winners.length > 1) {
        playRound(winners);
    } else {
    	//ici c'est le vainqueur et la fin du tournois
        console.log(`Tournament Champion: ${winners[0]}`);

        alert(`The great winner is : ${winners[0]} `);

        initTournament();
        return;
    }
    };

    handleRound();
}


function startGameWithPlayers(player1, player2) {
	console.log("Violet : " + player1 + " , " + player2);
    return new Promise((resolve, reject) => {
        console.log(`Starting the game between ${player1} and ${player2}`);

        // Initialize the game
        window.initGameT({
            onGameStart: () => console.log('Game started!'),
            onGameEnd: (winner) => {
                console.log(`Game ended. Winner: ${winner}`);
                resolve(winner);
            }
        }, player1, player2);
    });
}





async function createGameT(options = {}, player1, player2) {
    console.log("Creating new game instance");
    updateUserStatus('playing');
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    if (TisGameInitialized) {
        console.warn("A game is already running. Please end the current game before starting a new one.");
        return null;
    }

    const gameTab = document.getElementById('tournament');
    if (!gameTab) {
        console.error("Game container not found. Make sure there's an element with id 'game' in your HTML.");
        return null;
    }

    const { onGameStart = null , onGameEnd = null } = options;

    if (typeof onGameEnd !== 'function') {
        console.error('onGameEnd is not a function:', onGameEnd);
    }

    gameTab.innerHTML = `
        <h1 class="display-4">Pong Game</h1>
        <p class="lead">Challenge yourself or play against the AI in our classic Pong game.</p>
        <div id="gameArea" class="mt-4"></div>
        <p> ` + player1 + ` VS ` + player2 + ` </p>
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
    let player = { y: canvas.height / 2 - paddleHeight / 2, score: 0 , speed : 5};
    let ai = { y: canvas.height / 2 - paddleHeight / 2, score: 0, lastMoveTime: 0, targetY: canvas.height / 2 - paddleHeight / 2, speed : 5 };
    let ball = { x: canvas.width / 2, y: canvas.height / 2, dx: initialBallSpeed, dy: 0 };
    let animationFrameId = null;
    let isGameOver = false;

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
        if (!ThasIncrementedLoss) {
            await updateWinLossCount(false);
            ThasIncrementedLoss = true;
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
        aiupdatePlayerPosition();
        updatePlayerPosition();

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
            TisGameActive = false;
            const playerWon = player.score === 5;
            await updateWinLossCount(playerWon);
            await updateUserStatus('online');


            //setTimeout(() => {
                player.score = ai.score = 0;
                resetBall();
                isGameOver = false;
                TisGameInitialized = false;
                ThasIncrementedLoss = false;
console.log("Perle " + TisGameInitialized);
                alert(playerWon ? `${player1} Win` : `${player2} wins!`);
                document.getElementById('startGameBtn').style.display = 'block';
                drawGame();

            //}, 100);
 	        console.log("Carmin " + player1 + " " + player2 + "   " + TisGameInitialized);

console.log("Obscidienne Is Function : " +  onGameEnd + " ");

            if (typeof onGameEnd === 'function') {
     		   onGameEnd(playerWon ? player1 : player2);
    		} else {
                console.error('onGameEnd is not a function at game end.');
            }
    	    return;
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
        if (!TisGameInitialized || !TisGameActive) return;
        updateGame();
        drawGame();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

  ////PLayer 1  Control////
    function handleKeyDown(e) {
    console.log('Key pressed:', e.key);
    if (!isGameOver && TisGameActive) {
        if (e.key === 'w') {
            P1isUpPressed = true;
        } else if (e.key === 's') {
            P1isDownPressed = true;
        }

        if (e.key === 'ArrowUp') {
            P2isUpPressed = true;
        } else if (e.key === 'ArrowDown') {
            P2isDownPressed = true;
        }
    }
}

	function handleKeyUp(e) {
        console.log('Key pressed:', e.key);
        if (!isGameOver && TisGameActive) {
        if (e.key === 'w') {
            P1isUpPressed = false;
        } else if (e.key === 's') {
            P1isDownPressed = false;
        }

        if (e.key === 'ArrowUp') {
            P2isUpPressed = false;
        } else if (e.key === 'ArrowDown') {
            P2isDownPressed = false;
        }
    }
}


function updatePlayerPosition() {
    if (P1isUpPressed && !P1isDownPressed) {
        player.y -= player.speed;
        player.y = Math.max(0, player.y);  // Empêche de dépasser le bord supérieur du canvas
    }
    if (P1isDownPressed && !P1isUpPressed) {
        player.y += player.speed;
        player.y = Math.min(canvas.height - paddleHeight, player.y);  // Empêche de dépasser le bord inférieur du canvas
    }
}

///Fin player 1 Controle

function aiupdatePlayerPosition() {
    if (P2isUpPressed && !P2isDownPressed) {
        ai.y -= ai.speed;
        ai.y = Math.max(0, ai.y);  // Empêche de dépasser le bord supérieur du canvas
    }
    if (P2isDownPressed && !P2isUpPressed) {
        ai.y += ai.speed;
        ai.y = Math.min(canvas.height - paddleHeight, ai.y);  // Empêche de dépasser le bord inférieur du canvas
    }
}

///Fin player 2 Controle

	document.addEventListener('keydown', handleKeyDown);
	document.addEventListener('keyup', handleKeyUp);

    // Page Visibility API
    async function handleVisibilityChange() {
        console.log('Visibility changed. Hidden:', document.hidden);
        console.log('Game state - Initialized:', TisGameInitialized, 'Active:', TisGameActive, 'Over:', isGameOver);

        if (document.hidden && TisGameInitialized && TisGameActive && !isGameOver && !ThasIncrementedLoss) {
            console.log('Player left the game. Counting as a loss.');
            await incrementLossCount();
            isGameOver = true;
            TisGameActive = false;
            cancelAnimationFrame(animationFrameId);
            alert("You left the game. This counts as a loss.");
            document.getElementById('startGameBtn').style.display = 'block';
        } else if (!document.hidden && TisGameInitialized && TisGameActive && !isGameOver) {
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
        if (!TisGameActive) {
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
                TisGameInitialized = true;
                TisGameActive = true;
                ThasIncrementedLoss = false;
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
        TisGameInitialized = false;
        TisGameActive = false;
        ThasIncrementedLoss = false;
        isGameOver = false;
        cancelAnimationFrame(animationFrameId);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        canvas.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        gameTab.innerHTML = ''; // Clear the game area
    }

    // Return the cleanup function
    return cleanup;
}

// Make sure initGame is available globally
window.initGameT = function(options = {}, player1, player2) {


    console.log("Initializing new game");

    // Clean up any existing game before starting a new one
    if (typeof TcurrentGameInstance === 'function') {
        console.log("Cleaning up existing game");
        TcurrentGameInstance();
        TcurrentGameInstance = null; // Reset to null after cleanup
    }

    // Start a new game and store the cleanup function
    TcurrentGameInstance = createGameT(options, player1, player2);

    // Ensure TcurrentGameInstance is always a function
    if (typeof TcurrentGameInstance !== 'function') {
        TcurrentGameInstance = function() {
            console.log("No game instance to clean up.");
        };
    }

    console.log("New game initialized, cleanup function stored");







    //console.log("Initializing new game");

    // Clean up any existing game before starting a new one
    //if (TcurrentGameInstance) {
    //    console.log("Cleaning up existing game");
    //    TcurrentGameInstance();
    //    TcurrentGameInstance = null;
    //}
    // Start a new game and store the cleanup function
    //TcurrentGameInstance = createGameT(options, player1, player2);
    //console.log("New game initialized, cleanup function stored");
};

/*
window.initTournament = function(options = {}) {
    initTournament2();
}
*/
