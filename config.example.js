// Spotify API Configuration Example
// Copy this file to config.js and fill in your Spotify Client ID

const CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID';
const REDIRECT_URI = window.location.origin + window.location.pathname;
const SCOPES = 'user-read-currently-playing user-read-playback-state';

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CLIENT_ID, REDIRECT_URI, SCOPES };
}
