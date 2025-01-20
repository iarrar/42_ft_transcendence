function initLeaderBoard() {
    const leaderboardTab = document.getElementById('leaderboard');
    leaderboardTab.innerHTML = `
        <h1 class="display-4">Leaderboard</h1>
        <p class="lead">Try to improve your ranking and climb the leaderboard.</p>
        <br>
        <h3>Personal score</h3>
        <div id="personalScore"></div>

    <div class="row mt-5">
        <div class="col-12">
            <div class="mb-3">
                <label for="sortSelect" class="form-label">Sort by:</label>
                <select id="sortSelect" class="form-select">
                    <option value="wins" selected>Wins</option>
                    <option value="losses">Losses</option>
                    <option value="games_played">Games Played</option>
                </select>
            </div>
            <table class="table table-striped" id="leaderboardTable">
                <thead>
                    <tr>
                        <th scope="col">Rank</th>
                        <th scope="col">Username</th>
                        <th scope="col">Wins</th>
                        <th scope="col">Losses</th>
                        <th scope="col">Games Played</th>
                    </tr>
                </thead>
                <tbody>

                </tbody>
            </table>
        </div>
    </div>
    `;
    loadUserScoreInfo();
    loadLeaderboard('wins');
    document.getElementById('sortSelect').addEventListener('change', (e) => {
        loadLeaderboard(e.target.value);
    });
}

async function loadLeaderboard(sortBy = 'wins') {
    try {
        const response = await fetch(`http://localhost:8000/api/leaderboard/?sort_by=${sortBy}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const leaderboardData = await response.json();
            const leaderboardTable = document.getElementById('leaderboardTable').querySelector('tbody');
            leaderboardTable.innerHTML = '';

            leaderboardData.forEach((user, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <th scope="row">${index + 1}</th>
                    <td>${user.username}</td>
                    <td>${user.wins}</td>
                    <td>${user.losses}</td>
                    <td>${user.games_played}</td>
                `;
                leaderboardTable.appendChild(row);
                console.log('Leaderboard received:', leaderboardTable);
            });
        } else {
            throw new Error('Failed to load leaderboard data');
        }
    } catch (error) {
        console.error('Error loading leaderboard data:', error);
        showUpdateMessage('Failed to load leaderboard data. Please try again.', 'danger');
    }
}

async function loadUserScoreInfo() {
    try {
        const response = await fetch('http://localhost:8000/api/user/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json',
            },
        });
        if (response.ok) {
            console.log('Response is ok');  // Log the received data
            const userData = await response.json();
            const personalScoreVar = document.getElementById('personalScore');
            gamesPlayed = userData.games_played;
            gamesWin = userData.wins;
            gamesLose = userData.losses;
            if (userData.games_played == null)
                gamesPlayed = '0';
            if (userData.wins == null)
                gamesWin = '0';
            if (userData.losses == null)
                gamesLose = '0';
            personalScoreVar.innerHTML = `
                <p>${userData.username} as played ${gamesPlayed} time for ${gamesWin} wins and ${gamesLose} losses</p>
            `;
            console.log('User data received:', userData);  // Log the received data
        } else {
            throw new Error('Failed to load user data');
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showUpdateMessage('Failed to load user data. Please try again.', 'danger');
    }
}

function showUpdateMessage(message, type) {
    const messageElement = document.getElementById('updateMessage');
    messageElement.innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
    setTimeout(() => {
        messageElement.innerHTML = '';
    }, 5000);
}

window.initLeaderBoard = initLeaderBoard;
