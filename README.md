# Spotify-Thingy

A real-time Spotify now playing display for Twitch streams and OBS overlays. Shows the currently playing song, artist/band name, and album cover art that automatically updates as songs change.

## Features

- 🎵 Real-time display of currently playing track
- 🎨 Shows album cover art
- 👥 Displays artist/band name
- 🔄 Automatically updates when songs change
- 🎭 Transparent background perfect for stream overlays
- ✨ Smooth animations and modern design
- 🎮 Easy integration with OBS/Twitch

## Quick Demo

Want to see how it looks? Open `demo.html` in your browser to see a demo with sample songs that rotate automatically. This doesn't require any Spotify authentication and is perfect for testing your OBS setup.

## Setup Instructions

### 1. Create a Spotify Application

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create an App"
4. Fill in the app name (e.g., "Twitch Now Playing") and description
5. Agree to the terms and click "Create"
6. Copy your **Client ID**
7. Click "Edit Settings"
8. Add your Redirect URI:
   - For local testing: `http://localhost:8000/index.html` or `http://127.0.0.1:8000/index.html`
   - For hosted: Your actual URL (e.g., `https://yourdomain.com/spotify-display/index.html`)
9. Click "Save"

### 2. Configure the Application

1. Open `app.js` in a text editor
2. Find the line: `const CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID';`
3. Replace `YOUR_SPOTIFY_CLIENT_ID` with your actual Client ID from step 1
4. Save the file

### 3. Run the Application

#### Option A: Using Python's built-in server (recommended for testing)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open `http://localhost:8000/index.html` in your browser.

#### Option B: Using Node.js http-server
```bash
npm install -g http-server
http-server -p 8000
```

#### Option C: Using PHP's built-in server
```bash
php -S localhost:8000
```

#### Option D: Host on a web server
Upload all files to your web hosting and access via your domain.

### 4. Authorize with Spotify

1. Open the application in your browser
2. Click "Connect to Spotify"
3. Log in to Spotify and authorize the application
4. You'll be redirected back and should see your currently playing track!

### 5. Add to OBS/Twitch

1. In OBS, add a new "Browser Source"
2. Set the URL to where you're hosting the app (e.g., `http://localhost:8000/index.html`)
3. Set width to 600 and height to 180 (or adjust as needed)
4. Check "Refresh browser when scene becomes active" if desired
5. Click OK

The display will automatically update as your Spotify tracks change!

## Customization

### Styling
Edit `style.css` to customize:
- Colors (change `#1DB954` for Spotify green)
- Size of album art (`.album-art` width/height)
- Font sizes and styles
- Background opacity
- Animations

### Update Frequency
In `app.js`, change the polling interval (default is 5000ms = 5 seconds):
```javascript
refreshInterval = setInterval(getCurrentlyPlaying, 5000);
```

## Troubleshooting

**Display shows "Not Playing":**
- Make sure you're actively playing music on Spotify
- Ensure you authorized the correct Spotify account
- Try refreshing the page

**"Connect to Spotify" button doesn't work:**
- Check that your Client ID is correctly set in `app.js`
- Verify your Redirect URI matches in both Spotify Dashboard and your actual URL
- Check browser console for errors

**Token expired:**
- The app will automatically prompt you to reconnect
- Simply click "Connect to Spotify" again

**Not updating:**
- Check that your internet connection is stable
- Open browser console (F12) to check for errors
- Verify Spotify is actually playing (not paused)

## Technical Details

- Uses Spotify Web API for fetching currently playing track
- Implements OAuth 2.0 Implicit Grant Flow for authentication
- Polls the Spotify API every 5 seconds for updates
- Stores access token in localStorage for persistence
- Pure vanilla JavaScript - no frameworks required

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## License

Free to use and modify for personal and commercial projects.

## Support

For issues or questions, please open an issue on GitHub.