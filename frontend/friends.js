function initFriends() {
    const friendsTab = document.getElementById('friends');
    friendsTab.innerHTML = `
        <h1 class="display-4">Friends</h1>
        <div class="row">
            <div class="col-md-8">
                <h3>My Friends</h3>
                <div id="friendList" class="mb-4"></div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-body">
                        <h3 class="card-title">Add a Friend</h3>
                        <div class="form-group">
                            <input type="text" id="friendUsername" class="form-control" placeholder="Enter username">
                        </div>
                        <button id="addFriendBtn" class="btn btn-primary mt-2">Add Friend</button>
                        <div id="addFriendMessage" class="mt-2"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    loadFriends().then(() => {
        startFriendStatusRefresh();
    });
    document.getElementById('addFriendBtn').addEventListener('click', addFriend);
}

async function loadFriends() {
    try {
        const response = await fetch('http://localhost:8000/api/friends/', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
        });
        if (response.ok) {
            const friends = await response.json();
            displayFriends(friends);
        } else {
            throw new Error('Failed to load friends');
        }
    } catch (error) {
        console.error('Error loading friends:', error);
    }
}

function displayFriends(friends) {
    const friendList = document.getElementById('friendList');
    if (friends.length === 0) {
        friendList.innerHTML = '<p>You have no friends yet. Add some friends to get started!</p>';
        return;
    }
    friendList.innerHTML = friends.map(friend => `
        <div class="card mb-2">
            <div class="card-body d-flex justify-content-between align-items-center">
                <div>
                    <h5 class="card-title mb-0">${friend.username}</h5>
                    <span class="badge ${getStatusBadgeClass(friend.status)}">${friend.status}</span>
                </div>
                <button onclick="removeFriend(${friend.id})" class="btn btn-sm btn-outline-danger">Remove</button>
            </div>
        </div>
    `).join('');
}

function getStatusBadgeClass(status) {
    switch(status) {
        case 'online': return 'bg-success';
        case 'offline': return 'bg-secondary';
        case 'playing': return 'bg-warning text-dark';
        default: return 'bg-info';
    }
}

async function addFriend() {
    const username = document.getElementById('friendUsername').value;
    const messageElement = document.getElementById('addFriendMessage');
    try {
        const response = await fetch('http://localhost:8000/api/friends/add/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username }),
        });
        const data = await response.json();
        if (response.ok) {
            messageElement.innerHTML = `<div class="alert alert-success">${data.status}</div>`;
            document.getElementById('friendUsername').value = '';
            loadFriends();
        } else {
            throw new Error(data.error || 'Failed to add friend');
        }
    } catch (error) {
        console.error('Error adding friend:', error);
        messageElement.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
    }
    setTimeout(() => {
        messageElement.innerHTML = '';
    }, 5000);
}

async function removeFriend(friendId) {
    if (!confirm('Are you sure you want to remove this friend?')) {
        return;
    }
    try {
        const response = await fetch('http://localhost:8000/api/friends/remove/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ friend_id: friendId }),
        });
        if (response.ok) {
            loadFriends();
        } else {
            const data = await response.json();
            throw new Error(data.error || 'Failed to remove friend');
        }
    } catch (error) {
        console.error('Error removing friend:', error);
        alert(error.message);
    }
}

let friendRefreshInterval;

function startFriendStatusRefresh() {
    // Arrêter tout intervalle existant pour éviter les doublons
    if (friendRefreshInterval) {
        clearInterval(friendRefreshInterval);
    }
    // Démarrer un nouvel intervalle
    friendRefreshInterval = setInterval(loadFriends, 5000); // Rafraîchit toutes les 30 secondes
}

function stopFriendStatusRefresh() {
    if (friendRefreshInterval) {
        clearInterval(friendRefreshInterval);
    }
}

window.initFriends = initFriends;