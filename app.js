// Spotify API Configuration
const CLIENT_ID = '864b8ff54f774761bbf08c5cf36c761e'; // Replace with your Spotify Client ID
// Auto-detect if we're running locally or on GitHub Pages - use current URL
const REDIRECT_URI = window.location.origin + window.location.pathname;
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

// Refresh access token using refresh token
async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    
    if (!refreshToken) {
        console.log('No refresh token available');
        return false;
    }
    
    console.log('Refreshing access token...');
    
    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            }),
        });
        
        const data = await response.json();
        
        if (data.access_token) {
            accessToken = data.access_token;
            localStorage.setItem('spotify_access_token', accessToken);
            
            // Update refresh token if a new one is provided
            if (data.refresh_token) {
                localStorage.setItem('spotify_refresh_token', data.refresh_token);
            }
            
            // Update token expiry time
            const expiresIn = data.expires_in || 3600;
            const expiryTime = Date.now() + (expiresIn * 1000);
            localStorage.setItem('spotify_token_expiry', expiryTime.toString());
            
            console.log('Access token refreshed successfully');
            return true;
        } else {
            console.error('Failed to refresh token:', data);
            // Clear all tokens if refresh fails
            localStorage.removeItem('spotify_access_token');
            localStorage.removeItem('spotify_refresh_token');
            localStorage.removeItem('spotify_token_expiry');
            return false;
        }
    } catch (error) {
        console.error('Error refreshing token:', error);
        return false;
    }
}

// Exchange authorization code for access token
async function exchangeCodeForToken(code) {
    const codeVerifier = localStorage.getItem('code_verifier');
    
    console.log('Exchanging code for token...');
    console.log('Code:', code.substring(0, 20) + '...');
    console.log('Code verifier:', codeVerifier ? codeVerifier.substring(0, 20) + '...' : 'MISSING!');
    
    if (!codeVerifier) {
        console.error('Code verifier missing! This means the auth flow was interrupted.');
        alert('Authentication flow was interrupted. Please try connecting again.');
        localStorage.clear(); // Clear any stale data
        return false;
    }
    
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
            
            // Store refresh token for automatic token renewal
            if (data.refresh_token) {
                localStorage.setItem('spotify_refresh_token', data.refresh_token);
                console.log('Refresh token stored');
            }
            
            // Store token expiry time
            const expiresIn = data.expires_in || 3600; // Default 1 hour
            const expiryTime = Date.now() + (expiresIn * 1000);
            localStorage.setItem('spotify_token_expiry', expiryTime.toString());
            
            localStorage.removeItem('code_verifier');
            console.log('Access token obtained successfully');
            return true;
        } else {
            console.error('Failed to get access token:', data);
            localStorage.clear(); // Clear stale data to prevent loops
            alert('Token exchange failed: ' + (data.error_description || data.error || 'Unknown error'));
            return false;
        }
    } catch (error) {
        console.error('Error during token exchange:', error);
        localStorage.clear(); // Clear stale data to prevent loops
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
        
        // Clean up URL FIRST to prevent re-processing the code
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Exchange code for token
        const success = await exchangeCodeForToken(code);
        
        if (success) {
            console.log('Token exchange successful, showing now playing');
            showNowPlaying();
            startPolling();
        } else {
            console.error('Token exchange failed, showing login button');
            showLoginButton();
        }
    } else {
        // Check if we have a stored token
        const storedToken = localStorage.getItem('spotify_access_token');
        const tokenExpiry = localStorage.getItem('spotify_token_expiry');
        const refreshToken = localStorage.getItem('spotify_refresh_token');
        
        if (storedToken) {
            // Check if token is expired or about to expire (within 5 minutes)
            const now = Date.now();
            const expiry = tokenExpiry ? parseInt(tokenExpiry) : 0;
            
            if (expiry > 0 && now >= expiry - (5 * 60 * 1000)) {
                console.log('Token expired or expiring soon, attempting refresh...');
                const refreshed = await refreshAccessToken();
                if (refreshed) {
                    console.log('Token refreshed, showing now playing');
                    showNowPlaying();
                    startPolling();
                } else if (refreshToken) {
                    console.log('Refresh failed but have refresh token, showing login button');
                    showLoginButton();
                } else {
                    console.log('No refresh token, showing login button');
                    showLoginButton();
                }
            } else {
                console.log('Stored token found and valid');
                accessToken = storedToken;
                showNowPlaying();
                startPolling();
            }
        } else if (refreshToken) {
            // Have refresh token but no access token - try to refresh
            console.log('No access token but refresh token found, attempting refresh...');
            const refreshed = await refreshAccessToken();
            if (refreshed) {
                showNowPlaying();
                startPolling();
            } else {
                console.log('Refresh failed, showing login button');
                showLoginButton();
            }
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

        if (response.status === 401 || response.status === 403) {
            // Token expired or invalid - try to refresh
            console.log('Token invalid, attempting refresh...');
            const refreshed = await refreshAccessToken();
            
            if (refreshed) {
                console.log('Token refreshed, retrying request...');
                // Retry the request with new token
                getCurrentlyPlaying();
                return;
            } else {
                // Refresh failed - trigger reconnect
                console.log('Token refresh failed, showing reconnect button...');
                localStorage.removeItem('spotify_access_token');
                localStorage.removeItem('spotify_refresh_token');
                localStorage.removeItem('spotify_token_expiry');
                accessToken = null;
                stopPolling();
                showLoginButton();
                updateDisplay(null);
                return;
            }
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
        // On network error, try to reconnect after a few attempts
        handleNetworkError();
    }
}

// Handle network errors with reconnect logic
let errorCount = 0;
function handleNetworkError() {
    errorCount++;
    console.log(`Network error count: ${errorCount}`);
    
    if (errorCount >= 3) {
        // After 3 consecutive errors, show reconnect button
        console.log('Multiple errors detected, requiring reconnect...');
        localStorage.removeItem('spotify_access_token');
        accessToken = null;
        stopPolling();
        showLoginButton();
        updateDisplay(null);
        errorCount = 0; // Reset counter
    }
}

// Reset error count on successful fetch
function resetErrorCount() {
    errorCount = 0;
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

    // Reset error count on successful data
    resetErrorCount();

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
