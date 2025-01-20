function initMatchHistory() {
    const matchHistoryTab = document.getElementById('match-history');
    matchHistoryTab.innerHTML = `
        <h1 class="display-4">Match History</h1>
        <div id="matchHistoryList" class="mt-4"></div>
    `;

    loadMatchHistory();
}

async function loadMatchHistory() {
    try {
        const response = await fetch('http://localhost:8000/api/match-history/', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
        });
        if (response.ok) {
            const matches = await response.json();
            displayMatchHistory(matches);
        } else {
            throw new Error('Failed to load match history');
        }
    } catch (error) {
        console.error('Error loading match history:', error);
        showUpdateMessage('Failed to load match history. Please try again.', 'danger');
    }
}

function displayMatchHistory(matches) {
    const matchHistoryList = document.getElementById('matchHistoryList');
    if (matches.length === 0) {
        matchHistoryList.innerHTML = '<p>No match history available.</p>';
        return;
    }

    const matchesHtml = matches.map(match => {
        // Déterminer l'adversaire
        const opponent = match.opponent_username || 'AI';

        // Déterminer le résultat
        let result;
        if (match.user_score > match.opponent_score) {
            result = 'Win';
        } else if (match.user_score < match.opponent_score) {
            result = 'Loss';
        } else {
            result = 'Draw';
        }

        return `
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">Match against ${opponent}</h5>
                    <p class="card-text">
                        Date: ${new Date(match.date).toLocaleString()}<br>
                        Score: ${match.user_score} - ${match.opponent_score}<br>
                        Result: ${result}
                    </p>
                </div>
            </div>
        `;
    }).join('');

    matchHistoryList.innerHTML = matchesHtml;
}

window.initMatchHistory = initMatchHistory;