// Spotify API Configuration
const CLIENT_ID = '864b8ff54f774761bbf08c5cf36c761e'; // Replace with your Spotify Client ID
// Auto-detect if we're running locally or on GitHub Pages
const REDIRECT_URI = window.location.hostname === '127.0.0.1' 
    ? 'http://127.0.0.1:3000/index.html' 
    : 'https://antoniochieffallo.github.io/Spotify-Song-Display/index.html'; // Update with your GitHub Pages URL
const SCOPES = 'user-read-currently-playing user-read-playback-state';

// DOM Elements
const loginButton = document.getElementById('loginButton');
const authContainer = document.getElementById('authContainer');
const nowPlaying = document.getElementById('nowPlaying');
const coverImage = document.getElementById('coverImage');
const songTitle = document.getElementById('songTitle');
const artistName = document.getElementById('artistName');
const progressFill = document.getElementById('progressFill');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');

// State
let accessToken = null;
let refreshInterval = null;
let progressInterval = null;
let currentTrackId = null;
let trackDuration = 0;
let trackProgress = 0;
let lastUpdateTime = 0;
let isPlaying = false;

// PKCE Helper Functions
function generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

async function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
}

function base64encode(input) {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

// Exchange authorization code for access token
async function exchangeCodeForToken(code) {
    const codeVerifier = localStorage.getItem('code_verifier');
    
    console.log('Exchanging code for token...');
    console.log('Code:', code.substring(0, 20) + '...');
    console.log('Code verifier:', codeVerifier ? codeVerifier.substring(0, 20) + '...' : 'MISSING!');
    
    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
                code_verifier: codeVerifier,
            }),
        });
        
        console.log('Token response status:', response.status);
        const data = await response.json();
        console.log('Token response data:', data);
        
        if (data.access_token) {
            accessToken = data.access_token;
            localStorage.setItem('spotify_access_token', accessToken);
            localStorage.removeItem('code_verifier');
            console.log('Access token obtained successfully');
            return true;
        } else {
            console.error('Failed to get access token:', data);
            alert('Token exchange failed: ' + (data.error_description || data.error || 'Unknown error'));
            return false;
        }
    } catch (error) {
        console.error('Error during token exchange:', error);
        alert('Network error during token exchange: ' + error.message);
        return false;
    }
}

// Initialize app
async function init() {
    console.log('App initialized');
    console.log('Client ID:', CLIENT_ID);
    console.log('Redirect URI:', REDIRECT_URI);
    console.log('Current URL:', window.location.href);
    
    // Check if we have an authorization code in the URL (callback from Spotify)
    const params = new URLSearchParams(window.location.search);
    
    console.log('URL params:', window.location.search);
    console.log('Has code?', params.has('code'));
    
    // Check for errors in the URL
    if (params.has('error')) {
        console.error('Spotify auth error:', params.get('error'));
        alert('Spotify authorization failed: ' + params.get('error'));
        showLoginButton();
        return;
    }
    
    if (params.has('code')) {
        console.log('Authorization code found in URL');
        const code = params.get('code');
        
        // Exchange code for token
        const success = await exchangeCodeForToken(code);
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        if (success) {
            showNowPlaying();
            startPolling();
        } else {
            alert('Failed to authenticate with Spotify');
            showLoginButton();
        }
    } else {
        // Check if we have a stored token
        const storedToken = localStorage.getItem('spotify_access_token');
        if (storedToken) {
            console.log('Stored token found');
            accessToken = storedToken;
            showNowPlaying();
            startPolling();
        } else {
            console.log('No token found, showing login button');
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

// Spotify Authorization with PKCE
loginButton.addEventListener('click', async () => {
    const codeVerifier = generateRandomString(64);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);
    
    // Store code verifier for later use
    localStorage.setItem('code_verifier', codeVerifier);
    
    const authUrl = new URL('https://accounts.spotify.com/authorize');
    const params = {
        client_id: CLIENT_ID,
        response_type: 'code',
        redirect_uri: REDIRECT_URI,
        scope: SCOPES,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
    };
    
    authUrl.search = new URLSearchParams(params).toString();
    console.log('Auth URL:', authUrl.toString());
    console.log('Redirecting to Spotify...');
    window.location.href = authUrl.toString();
});

// Format time from milliseconds to MM:SS
function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Update progress bar smoothly
function updateProgressBar() {
    if (!isPlaying || trackDuration === 0) return;
    
    // Calculate current progress based on elapsed time
    const now = Date.now();
    const elapsed = now - lastUpdateTime;
    trackProgress += elapsed;
    lastUpdateTime = now;
    
    // Make sure we don't exceed duration
    if (trackProgress > trackDuration) {
        trackProgress = trackDuration;
    }
    
    const percentage = (trackProgress / trackDuration) * 100;
    progressFill.style.width = `${percentage}%`;
    currentTimeEl.textContent = formatTime(trackProgress);
}

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
            updateDisplay(data.item, data.progress_ms, data.is_playing);
        } else {
            updateDisplay(null);
        }
    } catch (error) {
        console.error('Error fetching currently playing:', error);
    }
}

// Update display with track information
function updateDisplay(track, progress = 0, playing = false) {
    if (!track) {
        songTitle.textContent = 'Not Playing';
        artistName.textContent = 'No active playback';
        coverImage.src = '';
        coverImage.alt = '';
        currentTrackId = null;
        isPlaying = false;
        progressFill.style.width = '0%';
        currentTimeEl.textContent = '0:00';
        durationEl.textContent = '0:00';
        return;
    }

    // Update progress state
    trackProgress = progress;
    trackDuration = track.duration_ms;
    lastUpdateTime = Date.now();
    isPlaying = playing;
    
    // Update duration display
    durationEl.textContent = formatTime(trackDuration);
    
    // Update progress bar immediately
    const percentage = (trackProgress / trackDuration) * 100;
    progressFill.style.width = `${percentage}%`;
    currentTimeEl.textContent = formatTime(trackProgress);

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
    
    // Poll every 5 seconds for track updates
    refreshInterval = setInterval(getCurrentlyPlaying, 5000);
    
    // Update progress bar every 100ms for smooth animation
    progressInterval = setInterval(updateProgressBar, 100);
}

// Stop polling
function stopPolling() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
}

// Start the app
init();
