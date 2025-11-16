// Spotify API Configuration
const CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID'; // Replace with your Spotify Client ID
const REDIRECT_URI = window.location.origin + window.location.pathname;
const SCOPES = 'user-read-currently-playing user-read-playback-state';

// DOM Elements
const loginButton = document.getElementById('loginButton');
const authContainer = document.getElementById('authContainer');
const nowPlaying = document.getElementById('nowPlaying');
const coverImage = document.getElementById('coverImage');
const songTitle = document.getElementById('songTitle');
const artistName = document.getElementById('artistName');

// State
let accessToken = null;
let refreshInterval = null;
let currentTrackId = null;

// Initialize app
function init() {
    // Check if we have a token in the URL (callback from Spotify)
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    if (params.has('access_token')) {
        accessToken = params.get('access_token');
        localStorage.setItem('spotify_access_token', accessToken);
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        showNowPlaying();
        startPolling();
    } else {
        // Check if we have a stored token
        const storedToken = localStorage.getItem('spotify_access_token');
        if (storedToken) {
            accessToken = storedToken;
            showNowPlaying();
            startPolling();
        } else {
            showLoginButton();
        }
    }
}

// Show login button
function showLoginButton() {
    authContainer.classList.remove('hidden');
    nowPlaying.classList.remove('active');
}

// Hide login button and show now playing
function showNowPlaying() {
    authContainer.classList.add('hidden');
    nowPlaying.classList.add('active');
}

// Spotify Authorization
loginButton.addEventListener('click', () => {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;
    window.location.href = authUrl;
});

// Fetch currently playing track
async function getCurrentlyPlaying() {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.status === 401) {
            // Token expired
            localStorage.removeItem('spotify_access_token');
            accessToken = null;
            stopPolling();
            showLoginButton();
            updateDisplay(null);
            return;
        }

        if (response.status === 204 || !response.ok) {
            // No track currently playing
            updateDisplay(null);
            return;
        }

        const data = await response.json();
        
        if (data && data.item) {
            updateDisplay(data.item);
        } else {
            updateDisplay(null);
        }
    } catch (error) {
        console.error('Error fetching currently playing:', error);
    }
}

// Update display with track information
function updateDisplay(track) {
    if (!track) {
        songTitle.textContent = 'Not Playing';
        artistName.textContent = 'No active playback';
        coverImage.src = '';
        coverImage.alt = '';
        currentTrackId = null;
        return;
    }

    // Only update if the track has changed
    if (track.id !== currentTrackId) {
        currentTrackId = track.id;
        
        // Add animation class
        document.querySelector('.song-info').classList.add('updating');
        setTimeout(() => {
            document.querySelector('.song-info').classList.remove('updating');
        }, 500);

        // Update song information
        songTitle.textContent = track.name;
        
        // Get artist names
        const artists = track.artists.map(artist => artist.name).join(', ');
        artistName.textContent = artists;
        
        // Update album cover
        if (track.album && track.album.images && track.album.images.length > 0) {
            // Use the medium-sized image (typically second in array)
            const imageUrl = track.album.images[0].url;
            coverImage.src = imageUrl;
            coverImage.alt = `${track.album.name} cover`;
        }
    }
}

// Start polling for updates
function startPolling() {
    // Initial fetch
    getCurrentlyPlaying();
    
    // Poll every 5 seconds
    refreshInterval = setInterval(getCurrentlyPlaying, 5000);
}

// Stop polling
function stopPolling() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// Start the app
init();
