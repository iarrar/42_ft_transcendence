// main.js

(function() {
    const tabHistory = [];
    let currentTabIndex = -1;

    function showTab(tabId, pushState = true) {
        if (!Auth.isAuthenticated()) {
            Auth.showAuthModal();
            return;
        }

        // Clean up the game if we're navigating away from the game tab
        if (tabId !== 'game' && currentGameInstance) {
            if (typeof currentGameInstance === 'function') {
                currentGameInstance();
            } else if (currentGameInstance instanceof Promise) {
                currentGameInstance.then(cleanup => {
                    if (typeof cleanup === 'function') {
                        cleanup();
                    }
                }).catch(error => console.error("Error cleaning up game:", error));
            }
            currentGameInstance = null;
            console.log("Current instance of the game has been cleaned up");
        }
        if (tabId !== 'friends') {
            stopFriendStatusRefresh();
        }
        if (tabId === 'friends') {
            startFriendStatusRefresh();
        }
        // Hide all tab contents
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(tab => tab.style.display = 'none');

        // Show the selected tab content
        console.log("Emeraude : ", tabId);
        const selectedTab = document.getElementById(tabId);
        console.log("Jaspe 1: " , selectedTab);
        if (selectedTab) {
            selectedTab.style.display = 'block';
        }

        // Update active state in navigation
        const navButtons = document.querySelectorAll('.nav-link');
        navButtons.forEach(button => button.classList.remove('active'));
        const activeButton = document.getElementById(`${tabId}Btn`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        // Call the init function for the selected tab
        if (tabId === 'home' && typeof initHome === 'function') initHome();
        else if (tabId === 'game' && typeof initGame === 'function') initGame();
        else if (tabId === 'user' && typeof initUser === 'function') initUser();
		else if (tabId === 'tournament' && typeof initTournament === 'function') initTournament();
		else if (tabId === '3d_pong' && typeof create3DPong === 'function') create3DPong();
        else if (tabId === 'leaderboard' && typeof initLeaderBoard === 'function') initLeaderBoard();
        else if (tabId === 'match-history' && typeof initMatchHistory === 'function') initMatchHistory();
        else if (tabId === 'friends' && typeof initFriends === 'function') initFriends();
        // else if (tabId === 'test' && typeof initTest === 'function') initTest();

        if (pushState) {
            // Update the URL and add to history
            history.pushState({ tabId: tabId }, '', `#${tabId}`);
            tabHistory.push(tabId);
            currentTabIndex = tabHistory.length - 1;
        }
        console.log("Jaspe 2: " , selectedTab);
    }


    function parseTokensFromUrl(url) {
        // Création d'une instance URL à partir de l'URL fournie
        const parsedUrl = new URL(url);

        // Récupération de la partie hash (après le #)
        const hash = parsedUrl.hash.substring(1); // Enlever le #

        // Création d'un objet URLSearchParams à partir du hash
        const params = new URLSearchParams(hash);

        // Extraction des tokens
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const username = params.get('username');

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            username: username,
        };
    }


    function handlePopState(event) {
        if (event.state && event.state.tabId) {
            showTab(event.state.tabId, false);
        } else {
            // Default to home if no state is available
            showTab('home', false);
        }
    }

    function initApp() {
        let currentUrl = window.location.href;
        console.log(currentUrl);
        let dico = parseTokensFromUrl(currentUrl);
        console.log(dico);
        if (dico.access_token && dico.refresh_token && dico.username)
        {
            console.log("Scope de verification init");
            localStorage.setItem('authToken', dico.access_token);
            localStorage.setItem('refreshToken', dico.refresh_token);
            localStorage.setItem('currentUser', dico.username);
        }

        // Initialize authentication
        Auth.init();

        if (!Auth.isAuthenticated()) {
            Auth.showAuthModal();
        } else {
            // Show initial tab
            const initialTab = location.hash.replace('#', '') || 'home';
            showTab(initialTab, false);
        }

        const navButtons = document.querySelectorAll('.nav-link');
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = e.target.id.replace('Btn', '');
                showTab(tabId);
            });
        });

        // Handle browser back/forward buttons
        window.addEventListener('popstate', handlePopState);


        // Handle sign out
        document.getElementById('signOutBtn').addEventListener('click', () => {
            Auth.signOut();
            // The redirect is now handled in the Auth.signOut() function


        });
    }

    // Make showTab available globally
    window.showTab = showTab;

    // Initialize the app when the DOM is fully loaded
    document.addEventListener('DOMContentLoaded', initApp);
})();
