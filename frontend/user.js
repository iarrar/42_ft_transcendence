function initUser() {
    const userTab = document.getElementById('user');
    userTab.innerHTML = `
        <style>
            .avatar-container {
                width: 200px;
                height: 200px;
                overflow: hidden;
                margin: 0 auto;
            }
            .avatar-container img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
        </style>
        <h1 class="display-4">User Profile</h1>
        <p class="lead">View and edit your user profile here.</p>
        <div class="row mt-4">
            <div class="col-md-3">
                <div class="avatar-container rounded-circle mb-3">
                    <img id="userAvatar" alt="User Avatar" class="avatar-image">
                </div>
            </div>
            <div class="col-md-9">
                <form id="userForm" class="needs-validation" novalidate>
                    <div class="mb-3">
                        <label for="username" class="form-label">Username</label>
                        <input type="text" class="form-control" id="username" name="username" required>
                        <div class="invalid-feedback">
                            Please choose a username.
                        </div>
                    </div>
                    <div class="mb-3">
                        <label for="email" class="form-label">Email</label>
                        <input type="email" class="form-control" id="email" name="email" required>
                        <div class="invalid-feedback">
                            Please provide a valid email.
                        </div>
                    </div>
                    <div class="mb-3 form-check">
                        <label class="form-check-label" for="enable2FA">Enable 2FA</label>
                        <input type="checkbox" class="form-check-input" id="enable_2fa">
                    </div>
                    <button type="submit" class="btn btn-primary">Update Profile</button>
                </form>
                <div id="updateMessage" class="mt-3"></div>
            </div>
        </div>
        <div class="row mt-4">
            <div class="col-md-6">
                <h3>Stats</h3>
                <ul class="list-group">
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        Games Played
                        <span class="badge bg-primary rounded-pill" id="gamesPlayed">0</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        Wins
                        <span class="badge bg-success rounded-pill" id="wins">0</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        Losses
                        <span class="badge bg-danger rounded-pill" id="losses">0</span>
                    </li>
                </ul>
            </div>
            <div class="col-md-6">
                <h3>Update Avatar</h3>
                <form id="avatarForm">
                    <div class="mb-3">
                        <input type="file" class="form-control" id="avatarInput" accept="image/*">
                    </div>
                    <button type="submit" class="btn btn-primary">Upload Avatar</button>
                </form>
            </div>
            <div class="row mt-4">
                <div class="col-12">
                    <h3>Match History</h3>
                    <div id="matchHistoryList"></div>
                </div>
            </div>
        </div>
    `;

    loadUserInfo();
    document.getElementById('userForm').addEventListener('submit', updateProfile);
    document.getElementById('avatarForm').addEventListener('submit', uploadAvatar);
    loadUserAvatar();
    loadMatchHistory();
}

async function loadUserInfo() {
    try {
        const response = await fetch('http://localhost:8000/api/user/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const userData = await response.json();
            console.log('User data received:', userData);  // Log the received data
            document.getElementById('username').value = userData.username;
            document.getElementById('email').value = userData.email;
            document.getElementById('gamesPlayed').textContent = userData.games_played || '0';
            document.getElementById('wins').textContent = userData.wins || '0';
            document.getElementById('losses').textContent = userData.losses || '0';
        } else {
            throw new Error('Failed to load user data');
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showUpdateMessage('Failed to load user data. Please try again.', 'danger');
    }
}

async function updateProfile(event) {
    event.preventDefault();
    const form = event.target;
    if (!form.checkValidity()) {
        event.stopPropagation();
        form.classList.add('was-validated');
        return;
    }

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;

    try {
        const response = await fetch('http://localhost:8000/api/user/update/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email }),
        });

        if (response.ok) {
            showUpdateMessage('Profile updated successfully!', 'success');
            loadUserInfo();  // Reload user info after successful update
        } else {
            throw new Error('Failed to update profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showUpdateMessage('Failed to update profile. Please try again.', 'danger');
    }
}

function showUpdateMessage(message, type) {
    const messageElement = document.getElementById('updateMessage');
    messageElement.innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
    setTimeout(() => {
        messageElement.innerHTML = '';
    }, 5000);
}


async function loadUserAvatar() {
    const avatarImg = document.getElementById('userAvatar');
    const response = await fetch('http://localhost:8000/api/user/', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
    });
    if (response.ok) {
        const userData = await response.json();
        console.log("Avatar URL:", userData.avatar);
        avatarImg.src = userData.avatar;
        avatarImg.onerror = () => {
            console.error("Failed to load avatar:", userData.avatar);
        };
    }
}

async function uploadAvatar(event) {
    event.preventDefault();
    const formData = new FormData();
    const fileField = document.getElementById('avatarInput');

    if (fileField.files[0]) {
        formData.append('avatar', fileField.files[0]);

        try {
            const response = await fetch('http://localhost:8000/api/user/upload-avatar/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                },
                body: formData
            });

            if (response.ok) {
                showUpdateMessage('Avatar uploaded successfully!', 'success');
                loadUserAvatar();
            } else {
                throw new Error('Failed to upload avatar');
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            showUpdateMessage('Failed to upload avatar. Please try again.', 'danger');
        }
    } else {
        showUpdateMessage('Please select an image to upload.', 'warning');
    }
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

async function updateUserStatus(status) {
    try {
        const response = await fetch('http://localhost:8000/api/user/update-status/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
        });
        if (!response.ok) {
            throw new Error('Failed to update status');
        }
    } catch (error) {
        console.error('Error updating status:', error);
    }
}

// Make initUser available globally
window.initUser = initUser;