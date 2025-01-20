let current3DGameInstance = null;
let is3DGameInitialized = false;

let isGameOver3D = false;
let isGameActive3D = false;

let P1isUpPresse3D = false;
let P1isDownPressed3D = false;

let heightBoard = 7;
let widthBoard = 15;

let speed3D = 0.05;


async function create3DPong(options = {}) {
    
    if (is3DGameInitialized) {
        console.warn("3D game already running.");
        return null;
    }

    const gameTab = document.getElementById('3d_pong');
    if (!gameTab) {
        console.error("Game container not found.");
        return null;
    }

    const { onGameStart = null } = options;

    gameTab.innerHTML = `
        <h1 class="display-4">3D Pong Game</h1>
        <p class="lead">Play Pong in 3D!</p>
        <div id="3dGameArea" class="mt-4"></div>
        <button id="start3DGameBtn" class="btn btn-success mt-3">Start 3D Game</button>
    `;
    
    // Set up Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(800, 400);
    document.getElementById('3dGameArea').appendChild(renderer.domElement);

    renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
    const composer = new THREE.EffectComposer(renderer);
    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth / 4 , window.innerHeight / 4),
        1.0,    // Force du glow
        0.2,    // Rayon
        0.85    // Seuil
    );
    composer.addPass(bloomPass);

    // Paddle and ball geometry
    const paddleWidth = 1, paddleHeight = 3, paddleDepth = 0.5;
    const ballSize = 0.5;

    //AI variables
    let lastMoveTime = 0;
    let targetY = heightBoard / 2;
    let aiReactionDelay = 0;
    let aiAccuracy = 0.9;
    let aiPredictionError = 0;
    let aiMovementSpeed = 0.05;

    const paddleGeometry = new THREE.BoxGeometry(paddleWidth, paddleHeight, paddleDepth);
    const ballGeometry = new THREE.SphereGeometry(ballSize, 32, 32);
    const wallGeometry = new THREE.BoxGeometry(widthBoard * 2, 0.5, 0.5); 
	const wallMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    //const material = new THREE.MeshPhysicalMaterial({ color: 0xffffff });
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const glowingMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 1.0,
      });

    
    ///ligne pointiller/    
    const lineMaterial = new THREE.LineDashedMaterial({
        color: 0xaaaaaa,
        dashSize: 0.5,
        gapSize: 0.3,
    });

    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, heightBoard, 0),
        new THREE.Vector3(0, -heightBoard, 0),
    ]);

    const centerLine = new THREE.Line(lineGeometry, lineMaterial);
    centerLine.computeLineDistances();

    scene.add(centerLine);
    /// ligne pointiller ///

    

    const playerPaddle = new THREE.Mesh(paddleGeometry, material);
    const leftWall = new THREE.Mesh(wallGeometry, glowingMaterial);
	const rightWall = new THREE.Mesh(wallGeometry, glowingMaterial);
    const aiPaddle = new THREE.Mesh(paddleGeometry, material);
    const ball = new THREE.Mesh(ballGeometry, material);

    // Positions
    playerPaddle.position.set(-widthBoard + 1, 0, 0);
    aiPaddle.position.set(widthBoard - 1, 0, 0);
    ball.position.set(0, 0, 0);
	camera.position.z = 10;
	camera.position.x = -15;
	camera.rotation.y = Math.PI * -0.2;
	camera.rotation.z = Math.PI * -0.5;
	
	leftWall.position.set( 0, -widthBoard / 2, 0);  // Mur à gauche
	rightWall.position.set(0, widthBoard / 2, 0);  // Mur à droite

	
	
    // Add objects to scene
    scene.add(playerPaddle);
    scene.add(aiPaddle);
    scene.add(ball);
	scene.add(leftWall);
	scene.add(rightWall);

    // Lighting (optional)
    // const light = new THREE.PointLight(0xffffff, 1.5);
    // light.position.set(0, 10, 0);
    // scene.add(light);

    

    // Game variables
    let playerScore = 0;
    let aiScore = 0;
    let ballSpeedX = 0.1, ballSpeedY = 0.05;


    ///score ////
    const scoreGeometry = new THREE.PlaneGeometry(10, 5);
    const scoreMaterial = new THREE.MeshBasicMaterial({ map: createScoreTexture(), transparent: true });
    const scorePlane = new THREE.Mesh(scoreGeometry, scoreMaterial);

    // Positionner le score au milieu du terrain, à plat sur le sol
    scorePlane.position.set(0, 0, -2.5); 
    scorePlane.rotation.z = -(Math.PI / 2);
    //scorePlane.rotation.x = Math.PI / 2;

    scene.add(scorePlane);
    /// score ////


    // function animate() {
    //     requestAnimationFrame(animate);
    //     updateGame();
    //     composer.render();
    // }
    //animate();


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


    // Game functions
    async function updateGame() {
        if (isGameOver3D) return;
        ball.position.x += ballSpeedX;
        ball.position.y += ballSpeedY;
        // Collision with top/bottom walls
        if (ball.position.y + ballSize > heightBoard || ball.position.y - ballSize < -heightBoard) {
            ballSpeedY = -ballSpeedY;
        }

        // Collision with paddles
        if (ball.position.x - ballSize < playerPaddle.position.x + paddleWidth / 2 &&
            ball.position.y < playerPaddle.position.y + paddleHeight / 2  &&
            ball.position.y > playerPaddle.position.y - paddleHeight / 2  
        )
        {
                ballSpeedX = Math.abs(ballSpeedX);
                let collidePoint = (ball.position.y - (playerPaddle.position.y + paddleHeight / 2)) / (paddleHeight / 2);
                ballSpeedY = speed3D * 1.5 * collidePoint;
                ball.position.x = playerPaddle.position.x + paddleWidth / 2 + ballSize;
        }
        if (ball.position.x + ballSize > aiPaddle.position.x - paddleWidth / 2 &&
            ball.position.y < aiPaddle.position.y + paddleHeight / 2 &&
            ball.position.y > aiPaddle.position.y - paddleHeight / 2
        )
        {
                ballSpeedX = -Math.abs(ballSpeedX);
                let collidePoint = (ball.position.y - (aiPaddle.position.y + paddleHeight / 2)) / (paddleHeight / 2);
                ballSpeedY = speed3D * 1.5 * collidePoint;
                ball.position.x = aiPaddle.position.x - paddleWidth / 2 - ballSize;
        }

		updatePlayerPosition();
		
        // Scoring
        if (ball.position.x - ballSize < -widthBoard) {
            aiScore++;
            resetBall();
        } else if (ball.position.x + ballSize > widthBoard) {
            playerScore++;
            resetBall();
        }

        if (playerScore === 3 || aiScore === 3) {
            isGameOver3D = true;
            isGameActive3D = false;
            const playerWon = playerScore === 3;
            await updateWinLossCount(playerWon);
            setTimeout(() => {
                alert(playerWon ? "You win!" : "AI wins!");
                playerScore = aiScore = 0;
                resetBall();
                isGameOver3D = false;
                is3DGameInitialized = false;
                hasIncrementedLoss = false;
                document.getElementById('start3DGameBtn').style.display = 'block';
                //drawGame();
            }, 100);
        }

        // Move AI paddle
        AIMovement()

        // Render scene
        //renderer.render(scene, camera);
        composer.render();
        // if (is3DGameInitialized) {
        //     requestAnimationFrame(updateGame);
        // }
        //animate();
    }

    function createScoreTexture() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;
    
        context.fillStyle = 'black';
        context.fillRect(0, 0, canvas.width, canvas.height);
    
        context.fillStyle = 'white';
        context.font = '48px ScoreFont';
    
        const text = `${playerScore} - ${aiScore}`;
    
        const textWidth = context.measureText(text).width;
        const xPosition = (canvas.width - textWidth) / 2;
        const yPosition = (canvas.height / 2) + 24;
        context.fillText(text, xPosition, yPosition);
    
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    

    function updateScore() {
        scoreMaterial.map = createScoreTexture();
        scoreMaterial.map.needsUpdate = true; // Indiquer que la texture a changé
    }

    
    function resetBall() {
        ball.position.set(0, 0, 0);
        //ballSpeedX = -ballSpeedX;
        //ballSpeedY = (Math.random() - 0.5) * 0.1;
        //ballSpeedY = speed3D * (Math.random() * 2 - 0.5);
        //ballSpeedX = (Math.random() - 0.5) * 0.5;
        //ballSpeedY = 0.05;
        ballSpeedX = (Math.random() > 0.5 ? 0.1 : -0.1);
        angle = (Math.random() - 0.5) * Math.PI / 2;
        ballSpeedY = Math.tan(angle) * ballSpeedX;// Math.abs(ballSpeedX);
        updateScore();
    }
    
    function handleKeyDown(e) {
    	if (!isGameOver3D){ //&& TisGameActive) {
        if (e.key === 'ArrowRight') {
            P1isUpPresse3D = true;
        } else if (e.key === 'ArrowLeft') {
            P1isDownPressed3D = true;
        	}
    	}
 	}
 	
 	function handleKeyUp(e) {
    	if (!isGameOver3D){ //&& TisGameActive) {
        if (e.key === 'ArrowRight') {
            P1isUpPresse3D = false;
        } else if (e.key === 'ArrowLeft') {
            P1isDownPressed3D = false;
        }
        }
	}
 	
 	document.addEventListener('keydown', handleKeyDown);
 	document.addEventListener('keyup', handleKeyUp);
 	
 	function updatePlayerPosition() {
    if (P1isUpPresse3D && !P1isDownPressed3D) {
        playerPaddle.position.y -= speed3D;
    }
    if (P1isDownPressed3D && !P1isUpPresse3D) {
        playerPaddle.position.y += speed3D;
    }
    playerPaddle.position.y = Math.max( -5, playerPaddle.position.y);
    playerPaddle.position.y = Math.min( 5, playerPaddle.position.y);
}
    

    // Start game button
    document.getElementById('start3DGameBtn').addEventListener('click', async() => {
        if (!is3DGameInitialized) {
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
                
                is3DGameInitialized = true;
                isGameActive3D = true;
                hasIncrementedLoss = false;
                isGameOver3D = false;
                document.getElementById('start3DGameBtn').style.display = 'none';
                animationFrameId = requestAnimationFrame(gameLoop);
                //animationFrameId = requestAnimationFrame(updateGame);
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

    // Cleanup function
    function cleanup3DGame() {
        is3DGameInitialized = false;
        gameTab.innerHTML = '';
    }

    function gameLoop() {
        if (!is3DGameInitialized || !isGameActive3D) return;
        updateGame();
        //drawGame();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function AIMovement()
    {
        const currentTime = Date.now();
        const hBoard = heightBoard;
        const wBoard = widthBoard;
        if (currentTime - lastMoveTime >= 1000){

            aiReactionDelay = Math.random() * 200;
            aiPredictionError = (Math.random() - 0.5) * wBoard * 0.1;

            let timeToReach = (wBoard - paddleWidth - ball.position.x) / ballSpeedX;
            let predictedY = ball.position.y + (ballSpeedY * timeToReach) + aiPredictionError;
            targetY = predictedY - paddleHeight / 2 ; 

            targetY = aiPaddle.position.y + (targetY - aiPaddle.position.y) * aiAccuracy;

            //targetY = Math.max(0, Math.min(hBoard - paddleHeight, targetY));
            targetY = Math.max(-hBoard, Math.min(hBoard , targetY));
            // targetY = Math.max(-(hBoard / 2) + paddleHeight / 2, 
            //     Math.min((hBoard / 2) - paddleHeight / 2, targetY));

            lastMoveTime = currentTime;            
        }

        if (currentTime - lastMoveTime >= aiReactionDelay){
            if (Math.abs(aiPaddle.position.y - targetY) > aiMovementSpeed){
                aiPaddle.position.y += aiPaddle.position.y < targetY ? aiMovementSpeed : -aiMovementSpeed;
            } else {
                aiPaddle.position.y = targetY;
            }
        }

        //aiPaddle.position.y = Math.max(0, Math.min(hBoard - paddleWidth, aiPaddle.position.y));
        // aiPaddle.position.y = Math.max(-(hBoard/2) + paddleWidth / 2, 
        //     Math.min(hBoard / 2 - paddleWidth / 2, aiPaddle.position.y));
        
        
        aiPaddle.position.y = Math.max( (-hBoard) + paddleWidth * 2, 
                            Math.min((hBoard) - paddleWidth * 2, aiPaddle.position.y));
    }

    //animate();
    return cleanup3DGame;
}


// Global access to the 3D Pong game initialization
window.init3DPong = function(options = {}) {
    if (current3DGameInstance) {
        current3DGameInstance();
        current3DGameInstance = null;
    }
    current3DGameInstance = create3DPong(options);
};
